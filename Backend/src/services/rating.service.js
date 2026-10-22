/**
 * Centralized rating calculation for DevClash MVP.
 * 
 * MVP Logic:
 * - Score >= 80: Considered a WIN. (+25 Rating)
 * - Score >= 50: Considered a PASS. (+5 Rating)
 * - Score < 50: Considered a LOSS. (-15 Rating)
 * 
 * @param {number} finalScore - The weighted AI evaluation score (0-100)
 * @returns {Object} { ratingChange, battleResult }
 */
const calculateRatingChange = (finalScore) => {
  if (finalScore >= 80) {
    return { ratingChange: 25, battleResult: 'WIN' };
  } else if (finalScore >= 50) {
    return { ratingChange: 5, battleResult: 'PASS' };
  } else {
    return { ratingChange: -15, battleResult: 'LOSS' };
  }
};

module.exports = {
  calculateRatingChange
};