'use strict';

module.exports = function(Review) {
  Review.beforeRemote('create', function(context, user, next) {
    context.args.data.date = Date.now();
    // set `publisherId` fk that we mentioned in model relations to current userId
    context.args.data.publisherId = context.req.accessToken.userId;
    next();
  });
};
