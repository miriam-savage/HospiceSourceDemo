# HospiceSourceDemo
Demo for Hospice Source. Uses firebase function to take in a JSON formatted dataset, add it to the database, and output a report.

## Missing or improved funcitonality thoughts
* Error handling should be centralized for easier updates, standardization, and transpiling. Same with text values like collection names and order types.
* HTTP are not necessarily correct. I pretty much used 400 for data errors and 500 for database level errors. I think this could be more granular.
* When multiple records are being added in one function and something down the line failes, need to undo the rest of the data. Transactions or batch operations are more than likely the answer here. I briefly took a look at them and it seemed like they would be the best bet - particularly a batch. Given time, this would be the next thing I would have looked at.
* Definitely not scalable. Performance would also need to be examined for improvements, particularly in the report output. Not sure on data volume or speeds, so this may actually be a non-issue. It would be worth doing some E2E with proper size data sets to see if this is an issue.
* Unit tests. I had hoped to have at least a sample (as my 'bell'), but I simply ran out of time.

## Thoughts on firebase
* I would get the following warning on occasion: `Warning: You're using Node.js v10.13.0 but Google Cloud Functions only supports v6.11.5.`. They don't seem to be concerned with upgrading. This makes sme wonder about maintenance. I prefer to use tools that are well taken care of.
* For tesitng, they have an offline and online mode. There are use cases for both. Real unit tests should be in offline mode. As a habit, developers should run at least before check-in (preference to every time they build at least for the section they are working in). They should be fast so this shouldn't take much time. Online mode would be better for E2E testing of these functions. 
