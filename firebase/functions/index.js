/**
 * ReviewPulse — Firebase Cloud Functions
 * 
 * Server-side operations that should not execute in the browser.
 * Deploy with: firebase deploy --only functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

const db = getFirestore();
const auth = getAuth();

// ==============================================================================
// AI Review Generation
// ==============================================================================

/**
 * Generate a review draft using Anthropic API.
 * Called from the client after quiz completion.
 */
exports.generateReviewDraft = onCall(async (request) => {
  // Verify authentication (optional - can be public with App Check)
  // if (!request.auth) {
  //   throw new HttpsError('unauthenticated', 'Must be authenticated');
  // }

  const { sessionId, factSheet, restaurantName } = request.data;

  if (!sessionId || !factSheet) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'AI service not configured');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const prompt = `You are helping a restaurant customer write a brief, authentic review draft for ${restaurantName}.
STRICT RULES:
1. Write in the first person ("I" / "We").
2. Length MUST be between 30 and 70 words.
3. Use ONLY facts from this Fact Sheet:
${JSON.stringify(factSheet, null, 2)}
4. Preserve sentiment: negative ratings MUST sound polite but dissatisfied; positive ratings must sound pleased.
5. Do NOT include staff names, prices, promotional offers, discounts, star ratings (e.g. "5 stars"), URLs, or hashtags.
6. Return plain text only without markdown formatting or quotation marks.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new HttpsError('internal', 'AI service request failed');
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim();

    if (!text) {
      throw new HttpsError('internal', 'AI service returned empty response');
    }

    return { text, method: 'llm' };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new HttpsError('internal', 'Failed to generate review draft');
  }
});

// ==============================================================================
// Analytics Aggregation
// ==============================================================================

/**
 * Aggregate analytics data for dashboard.
 * Can be scheduled to run periodically.
 */
exports.aggregateAnalytics = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const eventsSnapshot = await db.collection('events').get();
    const events = eventsSnapshot.docs.map(d => d.data());

    // Aggregate by event type
    const byType = {};
    events.forEach(event => {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    });

    // Aggregate by day
    const byDay = {};
    events.forEach(event => {
      const day = event.timestamp?.substring(0, 10) || 'unknown';
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      byType,
      byDay,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    throw new HttpsError('internal', 'Failed to aggregate analytics');
  }
});

// ==============================================================================
// Session Cleanup
// ==============================================================================

/**
 * Clean up old sessions (scheduled function).
 * Runs daily to remove abandoned sessions.
 */
exports.cleanupOldSessions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const oldSessions = await db
      .collection('sessions')
      .where('status', '==', 'landed')
      .where('createdAt', '<', thirtyDaysAgo.toISOString())
      .get();

    const batch = db.batch();
    oldSessions.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { deleted: oldSessions.size };
  } catch (error) {
    console.error('Session cleanup error:', error);
    throw new HttpsError('internal', 'Failed to clean up sessions');
  }
});
