const mongooose = require('mongoose');
const chatGroupSchema = new mongooose.Schema(
  {
    group_name: {
      type: String,
      required: true,
    },
    users: [],
    messages: [],
    lastMessageValue: {},
    admin: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
    cloudinary_img_id: { type: String },
  },
  {
    timestamps: true,
  }
);

const groupModel = mongooose.model('groups', chatGroupSchema);
module.exports = groupModel;
