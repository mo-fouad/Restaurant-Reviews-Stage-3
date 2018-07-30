/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */



    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}`;
    }

    /**
     * IndexedDB Promised
     */
    static get dbPromise() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        } else {
            return idb.open('restaurant-idb', 1, function (upgradeDb) {
                upgradeDb.createObjectStore('all-restaurants', {keyPath: 'id'});
                upgradeDb.createObjectStore('all-reviews', {keyPath: 'id'});
                upgradeDb.createObjectStore('offline-reviews', {keyPath: 'updatedAt'});
            });
        }
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {

        DBHelper.dbPromise.then(db => {
            if (!db) return;
            // 1. Look for restaurants in IDB
            const tx = db.transaction('all-restaurants');
            const store = tx.objectStore('all-restaurants');

            store.getAll().then(results => {
                if (results.length === 0) {

                    fetch(`${DBHelper.DATABASE_URL}/restaurants`) // Go for Net work, we cant find any DB here;
                        .then(response => {
                            return response.json();
                        })
                        .then(restaurants => {
                            // gett all the data from network and then put them into our DB
                            const tx = db.transaction('all-restaurants', 'readwrite');
                            const store = tx.objectStore('all-restaurants');
                            restaurants.forEach(restaurant => {
                                store.put(restaurant);
                            });
                            callback(null, restaurants);
                        })
                        .catch(error => {
                            callback(error, null);
                        });
                } else {
                    // Restaurants found in IDB
                    callback(null, results);
                }
            })
        });
    }

    /**
     * Fetch all Reviews.
     */


    static fetchReviews(restaurant, callback) {
        DBHelper.dbPromise.then(db => {
            if (!db) return;

            let resId = restaurant.id;

            // 1. Check if there are reviews in the IDB
            const tx = db.transaction('all-reviews');
            const store = tx.objectStore('all-reviews');

            // getting all reviews from IDB
            // Check if there is review related to the current restaurant
            // if there is // pass them to be reviewed
            // if not get them from the API then pass them to be reviewed.

            store.getAll()       // getting all reviews from IDB
                .then(results => {
                    //console.log(results.length);
                    let CurrentResReviewList = [];
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].restaurant_id == resId) { // Check if there is review related to the current restaurant
                            console.log(results[i].restaurant_id);
                            CurrentResReviewList.push(results[i]);
                        }
                    }
                    //console.log(CurrentResReviewList);
                    return CurrentResReviewList;
                })
                .then(results => {

                    if (results && results.length > 0) {
                        //console.log(results);
                        callback(null, results);  // if there is // pass them to be reviewed
                    } else {
                        // then getting reviews from network
                        fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`) // if not get them from the API then pass them to be reviewed.
                            .then(response => {
                                return response.json();
                            })
                            .then(reviews => {
                                this.dbPromise.then(db => {
                                    if (!db) return;
                                    // Put fetched reviews into IDB to be fetched offline later
                                    const tx = db.transaction('all-reviews', 'readwrite');
                                    const store = tx.objectStore('all-reviews');
                                    reviews.forEach(review => {
                                        store.put(review);
                                    })
                                });
                                // Continue with reviews from network
                                callback(null, reviews);
                            })
                            .catch(error => {
                                // catch any error of no from Network
                                callback(error, null);
                            })
                    }
                })
        })
    }

    static fetchReviewsFromOffline(restaurantID, callback) {
        DBHelper.dbPromise.then(db => {
            if (!db) return;

            const tx = db.transaction('offline-reviews');
            const store = tx.objectStore('offline-reviews');
            store.getAll()
                .then(results => {
                    let offlineCurrResReviewList = [];
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].restaurant_id == restaurantID) { // Check if there is review related to the current restaurant
                            console.log(results[i].restaurant_id);
                            offlineCurrResReviewList.push(results[i]);
                        }
                    }
                    return offlineCurrResReviewList;
                    console.log(offlineCurrResReviewList);
                }).then(results => {
                if (results && results.length > 0) {
                    console.log(results)
                    callback(null, results);
                }
            })
        })
    }

    // static testClass(MyArg) {
    //     console.log(MyArg);
    // }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        if (restaurant.photograph) {
            return (`/img/${restaurant.photograph}.jpg`);
        } else {
            return (`/img/restaurant.jpg`);
        }
    }

    /**
     * Restaurant image Alt Text.
     */

    static imageAltForRestaurant(restaurant) {
        return (`${restaurant.name}`);
    }

    /**
     * Restaurant image Rating.
     */

    // Getting review from old API

    static gettingRating(restaurant) {
        let reviews = restaurant.reviews;
        let rates = restaurant.reviews.map(rating => parseInt(rating.rating));
        let ratesLength = rates.length;
        let ratsSum = rates.reduce(getSum);

        function getSum(total, num) {
            return total + num;
        }

        return Math.round((ratsSum / ratesLength) * 10) / 10;

    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
            {
                title: restaurant.name,
                alt: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant)
            })
        marker.addTo(newMap);
        return marker;
    }


    // check if there is no restaurants favorite  in the DB

    static checkFavorite(restaurant, id) {
        restaurant["is_favorite"] = "false";

        fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/`, {
            method: 'PUT'
        }).then(response => {
            return response.json();
            console.log(response);
        }).catch(err => {
            console.log(err);
        })


    }

    // New functions to handel Statge 3
    // adding function to handel Is favorite

    static addingFav(restaurant, favuret) {
        fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${favuret}`, {
                method: 'PUT'
            }
        ).then(response => {
                return response.json();
            }
        ).then(myfav => {
                DBHelper.dbPromise.then(db => {
                    if (!db) return;
                    const tx = db.transaction('all-restaurants', 'readwrite');
                    const store = tx.objectStore('all-restaurants');
                    store.put(myfav)
                });
                return myfav;
            }
        ).catch(
            err => {
                restaurant.is_favorite = favuret;
                console.log(restaurant.is_favorite);
                DBHelper.dbPromise.then(db => {
                    if (!db) return;
                    const tx = db.transaction('all-restaurants', 'readwrite');
                    const store = tx.objectStore('all-restaurants');
                    store.put(restaurant);
                }).catch(err => {
                    console.log(err);
                    return;
                });
            }
        )
    }

    // handling the form

    static submitReview(data) {
        console.log(data);

        // based on this https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options
        return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
            body: JSON.stringify(data),
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, same-origin, *omit
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // *manual, follow, error
            referrer: 'no-referrer', // *client, no-referrer
        })
            .then(response => {
                response.json()
                    .then(data => {
                        this.dbPromise.then(db => {
                            if (!db) return;
                            // Put fetched reviews into IDB
                            const tx = db.transaction('all-reviews', 'readwrite');
                            const store = tx.objectStore('all-reviews');
                            store.put(data);
                        });
                        return data;
                    })
            })
            .catch(error => {
                /**
                 * Network offline.
                 * Add a unique updatedAt property to the review
                 * and store it in the IDB.
                 */
                data['updatedAt'] = new Date().getTime();
                console.log(data);

                this.dbPromise.then(db => {
                    if (!db) return;
                    // Put fetched reviews into IDB
                    const tx = db.transaction('offline-reviews', 'readwrite');
                    const store = tx.objectStore('offline-reviews');
                    store.put(data);
                    console.log('Review stored offline in IDB');
                });
                return;
            });
    }

    // Handeling Offline reviews

    static submitOfflineReviews() {
        DBHelper.dbPromise.then(db => {
            if (!db) return;
            const tx = db.transaction('offline-reviews');
            const store = tx.objectStore('offline-reviews');
            store.getAll().then(offlineReviews => {
                console.log(offlineReviews);
                offlineReviews.forEach(review => {
                    DBHelper.submitReview(review);
                });
                DBHelper.clearOfflineReviews(); // Calling to clean offline reviews from the DB
            })
        })
    }

    static clearOfflineReviews() {
        DBHelper.dbPromise.then(db => {
            const tx = db.transaction('offline-reviews', 'readwrite');
            const store = tx.objectStore('offline-reviews').clear();
        });
        return;
    }

}

