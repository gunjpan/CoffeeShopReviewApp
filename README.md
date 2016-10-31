# CASCON 2016 - Workshop
## Close Encounter With API Connect & LoopBack

### What will you learn:
- We will begin with a `hello-world` LoopBack application and build fully-functioning **CoffeeShopReviewApp** -- an application, similar to popular review sites such as Yelp, to review CoffeeShops.

  - Following LoopBack concepts will be covered during the process:
    - [Create DataSources](#step2-create-datasources) - apic edit
    - [Create Models & attach to DataSources](#step3-create-models) - apic edit
    - [Create Remote methods and expose them over REST API](#step4-create-simple-remote-method) - code
    - [Define Model Relations](#step5-define-model-relations) - apic cli
    - [Controlling access using ACL](#step6-define-access-controls) - apic cli
    - [Create a remote hook](#step7-create-a-remote-hook) - code
    - [Use boot scripts to automigrate data](#step8-use-boot-script-to-generate-sample-data) - code 
    - [Use `loopback-sdk-angular` to generate Angular client](#step9-generate-angular-client) - lb-ng tool

**Note:** 
> We are going to use both: API Connect Deigner (GUI) as well as the cli toolkit for the workshop.  

> If you want to jump to a particular step in the workshop, clone this repo and checkout a step before the one you want to continue on.
For example, let's say if you want to work on Step3, you can do following:
 ```
 $git clone git@github.com:gunjpan/CoffeeShopReviewApp.git
 $cd CoffeeShopReviewApp && npm install
 $git checkout step2
 ```
 Now, you have the project that is ready for step3 instructions


### Step1: create LoopBack application
  - name it `CoffeeShopReviewApp`
 
 ```console
  $ apic loopback
  ? What's the name of your application? CoffeeShopReviewApp
  ? Enter name of the directory to contain the project: CoffeeShopReviewApp
  ? What kind of application do you have in mind? hello-world (A project containing a controller, including a single vanilla Message and a single remote method)
```

**Note:** Step2 & Step3 are implemented using API Designer, use `apic edit` command and login with your `Bluemix` creds

### Step2: create DataSources
 - create two DataSources:
    - mongoDs - MongoDB datasource
    ```json
    "mongoDs": {
      "name": "mongoDs",
      "connector": "mongodb",
      "host": "demo.strongloop.com",
      "port": 27017,
      "database": "getting_started_intermediate",
      "username": "demo",
      "password": "L00pBack"
    }
    ```
    - mysqlDs - MySQL datasource
    ```json
    "mysqlDs": {
      "host": "demo.strongloop.com",
      "port": 3306,
      "database": "getting_started_intermediate",
      "password": "L00pBack",
      "name": "mysqlDs",
      "connector": "mysql",
      "user": "demo"
    },
    ```

### Step3: Create Models
  - First, remove `message` model as we won't use it.
  - create model: CoffeeShop
    - base: PersistedModel
    - properties:
      - `name` - type: string, required: true
      - `city` - type: string, required: true
    - ds: mysqlDs

  - create model: Review
    - base: PersistedModel
    - properties:
      - `date` - type: date, required: true
      - `rating` - type: number, required: true
      - `comments` - type: string, required: true
    - ds: mongoDs

  - create model: Reviewer
    - base: User
    - properties: default User properties
    - ds: mongoDs

### Step4: Create Simple Remote method
  - create following remote method for `CoffeeShop` model , named `status`, in `common/coffee-shop.js`:
  ```javascript
    Coffeeshop.status = function(cb) {
      var currentDate = new Date();
      var currentHour = currentDate.getHours();
      var OPEN_HOUR = 6;
      var CLOSE_HOUR = 20;

      console.log('Current hour is ' + currentHour);

      var response;
      if (currentHour > OPEN_HOUR && currentHour < CLOSE_HOUR) {
        response = 'We are open for business.';
      } else {
        response = 'Sorry, we are closed. Open daily from 6am to 8pm.';
      }
      cb(null, response);
    };

    Coffeeshop.remoteMethod(
      'status', {
        http: {
          path: '/status',
          verb: 'get'
        },
        returns: {
          arg: 'status',
          type: 'string'
        }
      }
    );
  ```

 - use `apic loopback:refresh` to regenerate API Specification that includes our new remote method

### Step5: Define Model Relations
We'll use `apic loopback:relation` generator to create relations.

In our app, models are related as follows:

  - A coffee shop has many reviews
  
    ```console
      ? Select the model to create the relationship from: CoffeeShop
      ? Relation type: has many
      ? Choose a model to create a relationship with: Review
      ? Enter the property name for the relation: reviews
      ? Optionally enter a custom foreign key:
      ? Require a through model? Note
    ```
  
  - A coffee shop has many reviewers.
  
  ```console
    ? Select the model to create the relationship from: CoffeeShop
    ? Relation type: has many
    ? Choose a model to create a relationship with: Reviewer
    ? Enter the property name for the relation: reviewers
    ? Optionally enter a custom foreign key:
    ? Require a through model? No
  ```
  
  - A review belongs to a coffee shop.
  
    ```console
    ? Select the model to create the relationship from: Review
    ? Relation type: belongs to
    ? Choose a model to create a relationship with: CoffeeShop
    ? Enter the property name for the relation: coffeeShop
    ? Optionally enter a custom foreign key:
    ```
    
  - A review belongs to a reviewer.
    ```console
    ? Select the model to create the relationship from: Review
    ? Relation type: belongs to
    ? Choose a model to create a relationship with: Reviewer
    ? Enter the property name for the relation: reviewer
    ? Optionally enter a custom foreign key: publisherId
    ```
    
  - A reviewer has many reviews.
    ```console
    ? Select the model to create the relationship from: Reviewer
    ? Relation type: has many
    ? Choose a model to create a relationship with: Review
    ? Enter the property name for the relation: reviews
    ? Optionally enter a custom foreign key:
    ? Require a through model? No
    ```

  Use `apic loopback:refresh` to regenerate API Specification.

### Step6: Define Access Controls

We are going to set up access control for the `Review` model. The access controls should enforce following rules:

- Anyone can read reviews, but you must be logged in to create, edit, or delete them.
- Anyone can register as a user; then log in and log out.
- Logged-in users can create new reviews, and edit or delete their own reviews; however they cannot modify the coffee shop for a review.

We will use `apic loopback:acl` generator for applying ACL.
  steps to achieve this:
  - Deny everyone all endpoints
  
    ```console
      ? Select the model to apply the ACL entry to: (all existing models)
      ? Select the ACL scope: All methods and properties
      ? Select the access type: All (match all types)
      ? Select the role: All users
      ? Select the permission to apply: Explicitly deny access
    ```
    
  - Allow everyone to read reviews
    
    ```console
      ? Select the model to apply the ACL entry to: Review
      ? Select the ACL scope: All methods and properties
      ? Select the access type: Read
      ? Select the role: All users
      ? Select the permission to apply: Explicitly grant access
    ```
    
  - Allow authenticated users to write a review
  
    ```console
      ? Select the model to apply the ACL entry to: Review
      ? Select the ACL scope: A single method
      ? Enter the method name: create
      ? Select the role: Any authenticated user
      ? Select the permission to apply: Explicitly grant access
    ```
    
  - Enable the publisher of a review (its "owner") to make any changes to it
    
    ```console
      ? Select the model to apply the ACL entry to: Review
      ? Select the ACL scope: All methods and properties
      ? Select the access type: Write
      ? Select the role: The user owning the object
      ? Select the permission to apply: Explicitly grant access
    ```


### Step7: Create a remote hook

  Here, we are going to create a `beforeRemote()` hook for `Review` model's `create` method, in `common/models/review.js` as follows:

  ```javascript
  module.exports = function(Review) {
  Review.beforeRemote('create', function(context, user, next) {
    context.args.data.date = Date.now();
    context.args.data.publisherId = context.req.accessToken.userId;
    next();
  });
};
```

### Step8: Use boot script to generate sample data

Now, let's create some sample data and persist it to the database using boot script.
  - create a file: `create-sample-data.js` inside `server/boot/` dir and copy-paste following code:
    ```javascript
      'use strict';

      var async = require('async');

      module.exports = function(app) {
        // data sources
        var mongoDs = app.dataSources.mongoDs;
        var mysqlDs = app.dataSources.mysqlDs;

        // create all models
        async.parallel({
          reviewers: async.apply(createReviewers),
          coffeeShops: async.apply(createCoffeeShops)
        }, function(err, results) {
          if (err) throw err;

          createReviews(results.reviewers, results.coffeeShops, function(err) {
            if (err) throw err;
            console.log('> models created successfully');
          });
        });

        // create reviewers
        function createReviewers(cb) {
          mongoDs.automigrate('Reviewer', function(err) {
            if (err) return cb(err);

            app.models.Reviewer.create([
              {email: 'foo@bar.com', password: 'foobar'},
              {email: 'john@doe.com', password: 'johndoe'},
              {email: 'jane@doe.com', password: 'janedoe'}
            ], cb);
          });
        }

        // create coffee shops
        function createCoffeeShops(cb) {
          mysqlDs.automigrate('CoffeeShop', function(err) {
            if (err) return cb(err);

            app.models.CoffeeShop.create([
              {name: 'Bel Cafe', city: 'Vancouver'},
              {name: 'Three Bees Coffee House', city: 'San Mateo'},
              {name: 'Caffe Artigiano', city: 'Vancouver'}
            ], cb);
          });
        }

        // create reviews
        function createReviews(reviewers, coffeeShops, cb) {
          mongoDs.automigrate('Review', function(err) {
            if (err) return cb(err);

            var DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

            app.models.Review.create([
              {
                date: Date.now() - (DAY_IN_MILLISECONDS * 4),
                rating: 5,
                comments: 'A very good coffee shop.',
                publisherId: reviewers[0].id,
                coffeeShopId: coffeeShops[0].id
              },
              {
                date: Date.now() - (DAY_IN_MILLISECONDS * 3),
                rating: 5,
                comments: 'Quite pleasant.',
                publisherId: reviewers[1].id,
                coffeeShopId: coffeeShops[0].id
              },
              {
                date: Date.now() - (DAY_IN_MILLISECONDS * 2),
                rating: 4,
                comments: 'It was ok.',
                publisherId: reviewers[1].id,
                coffeeShopId: coffeeShops[1].id
              },
              {
                date: Date.now() - (DAY_IN_MILLISECONDS),
                rating: 4,
                comments: 'I go here everyday.',
                publisherId: reviewers[2].id,
                coffeeShopId: coffeeShops[2].id
              }
            ], cb);
          });
        }
      };
    ```

### Step9: Generate Angular client
To generate the Angular services for a LoopBack application, we will use the AngularJS SDK `lb-ng` command-line tool.
  - First, disable `server/boot/root.js` by deleting or renaming to some other extension than `.js`
  - Create the `client/js/services` directory, if you don’t already have it (by using the mkdir command, for example).
  - Update `middleware.json` to use `loopback#static` middleware and configure it to serve client files from `client` directory:
    
    ```json
      "files": {
      "loopback#static": {
        "params": "$!../client"
      }
    },
    ```
    
  - Now, in the project root directory, enter the lb-ng command as follows:

  ```console
$ mkdir -p client/js/services
$ lb-ng server/server.js client/js/services/lb-services.js

  ```
  
  **Note:**

  >The `lb-ng` tool does the “heavy lifting” of creating the client JavaScript API that works with your LoopBack back-end. However, you still need to create the HTML/CSS and client JavaScript code that actually calls into this AngularJS API and defines the client-side functionality and appearance of your app. In general, creating this part of the app is entirely up to you. This tutorial includes an example of such a client implementation that you can use to understand the process.

  For this excercise, we will copy other client files - all required client side code for a functioning application - to our project:

  `$ cp -r workshopHelpers/client <your-app-dir>/client`

When done, run your application as:
`$ node .` and access it at: `localhost:3000`
