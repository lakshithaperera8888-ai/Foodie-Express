const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://lakshithanayanagith4444_db_user:EaHb4eUj4S9nvYRu@cluster0.ecmoqlz.mongodb.net/?appName=Cluster0')
  .then(() => { console.log('Connected'); process.exit(0); })
  .catch((e) => { console.log('Failed:', e); process.exit(1); });
