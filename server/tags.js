// Pulls #hashtags out of text: letters, numbers and underscores, 2-30 characters, lowercased and unique.
exports.extract = (text = '') =>
  [...new Set((text.match(/#[\p{L}\p{N}_]{2,30}/gu) || []).map((s) => s.slice(1).toLowerCase()))];
