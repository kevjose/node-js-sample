var mongoose = require('mongoose');

var PostSchema = mongoose.Schema({
	text: String,
	createdBy: String
});

module.exports= mongoose.model('Post',PostSchema);
