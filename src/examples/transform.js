module.exports = (record, number) => {
  // Returning 'null' or 'undefined' will filter out records
  if (record.hashtag === "#sample") return null;

  // Records can be completely transformed
  return {
    hashtag: record.hashtag,
    count: parseInt(record.count, 10),
    active: record["is active"] === "true",
  };
};
