let restaurant;
var newMap;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoibW9mb3VhZDIwMTEiLCJhIjoiY2pqY3Z3ZG1nNDdveTN2bW03YTRxYWs3cyJ9.BQKbQX3xy23PiLZz0N_5XA',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            DBHelper.fetchReviews(self.restaurant, (error, reviews) => {
                self.restaurant.reviews = reviews;
                if (!reviews) {
                    console.error(error);
                }
                fillRestaurantHTML();
                callback(null, restaurant)
            });

        });
    }

    if ( !window.navigator.onLine) {
        console.log(id);
        DBHelper.fetchReviewsFromOffline(id, (error, offlinereviews) => {


            if (!offlinereviews) {
                console.error(error);
            }
            liClass = "custom" ;
            fillOfflineReview(offlinereviews, liClass);

            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;


    if (!restaurant.is_favorite) {
       // console.log(restaurant.is_favorite);
        DBHelper.checkFavorite(restaurant, restaurant.id );
    }

    const isFav = document.getElementById('addToFavourite');
   // console.log(JSON.parse(restaurant.is_favorite));
    isFav.checked = JSON.parse(restaurant.is_favorite);
    isFav.addEventListener('change', event => {
        DBHelper.addingFav(restaurant, event.target.checked); // Calling for the function from DBhelper
    });


    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.alt = DBHelper.imageAltForRestaurant(restaurant);

    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};



/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }

    const ul = document.getElementById('reviews-list');
    let liClass = "normal";

    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review, liClass));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, liClass) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.classList.add(liClass);
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = new Date(review.updatedAt).toDateString();
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

fillOfflineReview = (offlinereviews, liClass) => {
    const ul = document.getElementById('reviews-list');
    console.log(offlinereviews);
    offlinereviews.forEach(review => {
        console.log("review");
        ul.appendChild(createReviewHTML(review, liClass));
    });
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


// Adding form handleing

const form = document.getElementById("reviews-form");
form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the form

    let review = {"restaurant_id": self.restaurant.id}; // getting restaurant ID

    // https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
    // getting the submission data

    const formData = new FormData(form);

    for (var [key, value] of formData.entries()) {
        review[key] = value;
    }

   // console.log(review);

    DBHelper.submitReview(review)
        .then(data => { // Adding current submission to current restaurant
            const reviewsList = document.getElementById('reviews-list');

            let liClass = "custom";
            reviewsList.appendChild(createReviewHTML(review, liClass));
            form.reset();
        })
        .catch(error => console.error(error))
});
