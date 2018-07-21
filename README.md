## Project Overview: Stage 2

to run the project please install npm packages. > IDB
```
npm install
```
 
After the instalation is complete please make sure that you can run the python server 
```
python -m http.server 8000
```
## Information about the project

please fined the initiation of the indexedDB in

> js/indexed-db.js

you can fined the changes on the dbhelper.js as the following  

here i changed the URL to get the data from the local API
```
static get DATABASE_URL() { 
       return `http://localhost:1337/restaurants`;
}
```

in the following function i changed the way it behaves to check if we have data in the indexed DB or not, 
if we have data int it .. it will load data from it, specially when offline, if not, 
it will get the data from the API and then store it into the index DB then wen can get this data later


```
static fetchRestaurants(callback, id) {

        dbPromise.then(db => {
            if (!db) return;
            let mydata =  db.transaction('restaurants').objectStore('restaurants').getAll();
            return mydata;

        }).then( mydataToJson => {
            if (mydataToJson.length > 0) {
                callback(null, mydataToJson);
                console.log("Getting data from Indexed DP");
                callback(null, mydataToJson);

            } else {
                let fetchURL;

                if (!id) {
                    fetchURL = DBHelper.DATABASE_URL;
                }
                else {
                    fetchURL = DBHelper.DATABASE_URL + '/' + id;
                }

                fetch (fetchURL, {method:'GET'})
                    .then(response => {
                        response.json().then(restaurants => {
                            console.log('Getting data from Fetch');
                            storingIntoDB(restaurants);
                            callback(null, restaurants);
                        })
                    })
                    .catch(error =>{
                        callback('Request failed' + error)
                    })
            }
        });
    }
```