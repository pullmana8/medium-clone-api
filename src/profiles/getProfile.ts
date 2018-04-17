import { Handler, Context, Callback } from 'aws-lambda';
import { validateToken } from '../auth/authorizer';
import { User } from '../models/User';
import { connectToDatabase } from '../common/db';

export const getProfile: Handler = (
    event: any,
    context: Context,
    callback: Callback
) => {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log('auth:', event.authorizationToken);
    connectToDatabase()
        .then(() => {
            return Promise.all([
                User.findOne({
                    username: event.pathParameters.username
                }).exec(),
                validateToken(event.headers.authorization)
                    .then(decoded => {
                        console.log('decode', decoded);
                        return User.findById(decoded.id).exec();
                    })
                    .catch(() => Promise.resolve(undefined))
            ]);
        })
        .then(([target, self]) => {
            console.log(target, self);
            if (!target) {
                return callback(undefined, {
                    statusCode: 404
                });
            }

            if (!self) {
                return callback(undefined, {
                    statusCode: 200,
                    body: {
                        profile: target.toProfileJSONFor()
                    }
                });
            }
            return callback(undefined, {
                statusCode: 200,
                body: {
                    profile: target.toProfileJSONFor(self)
                }
            });
        });
};
