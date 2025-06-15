module.exports = {
  db: { database: 'dbname', username: 'userhere', password: 'passhere', host: 'localhost', dialect: 'mysql' },
  sessionSecret: '9g52430b189d5c6e17ff5b8b70c834f2',
  uploadDir: process.env.UPLOAD_DIR || 'upload/directory/here'
};
