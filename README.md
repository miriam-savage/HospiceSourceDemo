# HospiceSourceDemo
Demo for Hospice Source.

## Missing funcitonality
* Error handling should be centralized for easier updates, standardization, and transpiling. Same with text values like collection names and order types.
* HTTP return codes need to be reviewed. (Proper return codes not always used.)
* When multiple records are being added in one function and something down the line failes, need to undo the rest of the data. (Transactions or batch operations are more than likely the answer here.)
* Definitely not scalable. Performance would also need to be examined for improvements.
