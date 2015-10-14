function movieApp () {
  //listens for when search is performed
  var searchInput = document.getElementById('search-form');
  searchInput.addEventListener('submit', searchOMDB);

  //listens for when user requests favorites page
  var favLink = document.getElementById('fav-link');
  favLink.addEventListener('click', getFavorites);

  //perform AJAX search to OMDB API using search query from input
  //**response type will be JSON**
  //when status and readystate change to 200 and 4, this means search
  //was successful and we can display results in the updateResults function
  function searchOMDB (event) {
    event.preventDefault();
    var xhttp = new XMLHttpRequest(),
        query = document.getElementById('search-input').value,
        urlString = 'http://www.omdbapi.com/?s=' + query;
    xhttp.responseType = 'json';
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var searchResults = xhttp.response.Search;
        updateResults(searchResults);
      }
    };
    xhttp.open('GET', urlString);
    xhttp.send();
  }

  //builds DOM elements, populates with data returned from AJAX request,
  //and adds them to the main Div#content.
  //adds click event listeners to each movie item so they will lead user
  //to a details view of the specific movie. the link contains a data field
  //with the movie ID for getting the movie details from OMDB API.
  //Adds a button to each movie listing if it is not already in favorites.
  function updateResults (data) {
    var content = document.getElementById('content'),
        resultList = document.createElement('ul');
    content.innerHTML = '';
    if (typeof data === 'undefined') {
      content.innerText = 'No Results Found!';
      return;
    }
    data.forEach (function (movie) {
      var dataID = movie.imdbID,
          newLi = document.createElement('li'),
          newImg = document.createElement('img'),
          newA = document.createElement('a');
      getFavButton(newLi, movie);
      if (movie.Poster !== 'N/A') {
        newImg.setAttribute('src', movie.Poster);
      }
      var link = document.createTextNode(movie.Title + ' (' + movie.Year + ')');
      newA.setAttribute('data-movieid', dataID);
      newA.href = "#";
      newA.appendChild(newImg);
      newA.appendChild(link);
      newLi.appendChild(newA);
      resultList.appendChild(newLi);
      newA.addEventListener('click', getMovieDetails);
    });
    content.appendChild(resultList);
  }

  //To get the movie's detailed view, we make another AJAX request to the
  //OMDB API, this time using the movie's id which we stored in the data-movieid
  //attribute of the link (currentTarget). When we get our response, we
  //pass them onto the showMovieDetails function.
  function getMovieDetails(event) {
    event.preventDefault();
    var movieID = event.currentTarget.getAttribute('data-movieid'),
        urlString = 'http://www.omdbapi.com/?plot=full&i=' + movieID,
        xhttp = new XMLHttpRequest();
    xhttp.responseType = 'json';
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var movieDetails = xhttp.response;
        showMovieDetails(movieDetails);
      }
    };
    xhttp.open('GET', urlString);
    xhttp.send();
  }

  //builds DOM elements, fills with appropriate data from AJAX request.
  //adds elements to main Div#content
  //getFavButton is called and will either place a button to add the movie
  //as a favorite, or will put text showing this movie is already in favorites
  function showMovieDetails (movie) {
    var content = document.getElementById('content'),
        movieTable = document.createElement('table');
    content.innerHTML = '';
    getFavButton(content, movie);
    if (movie.Poster !== 'N/A') {
      newImg = document.createElement('img');
      newImg.setAttribute('src', movie.Poster);
      content.appendChild(newImg);
    }
    for (var property in movie) {
      if (property === 'Poster') {
        continue;
      }
      newRow = document.createElement('tr');
      newCellName = document.createElement('td');
      newCellData = document.createElement('td');
      newCellName.innerText = property;
      newCellData.innerText = movie[property];
      newRow.appendChild(newCellName);
      newRow.appendChild(newCellData);
      movieTable.appendChild(newRow);
    }
    content.appendChild(movieTable);
  }

  //an AJAX request is made, this time to our own backend to check if the
  //movie is already in favorites. When our response is received, we set
  //the status and call the function that will update the view accordingly
  function getFavButton (el, movie) {
    var xhttp = new XMLHttpRequest();
    xhttp.responseType = 'json';
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var status = false;
        favorites = xhttp.response;
        favorites.forEach(function (fav) {
          if (fav.oid === movie.imdbID) {
            status = true;
          }
        });
        setFavStatus(el, movie, status);
      }
    };
    xhttp.open('GET', '/favorites');
    xhttp.send();
  }

  //puts a button on the page allowing user to favorite the movie if it isn't
  //already in favorites, or adds the text 'movie is in favorites'
  //if the button is added, include event listener on button to trigger add
  //favorite method.
  //Attributes are included in the button element so that all the information
  //needed to add a favorite is included right on the button, which is all the
  //event will see when the button is clicked.
  function setFavStatus (el, movie, status) {
    if (!status) {
      favButton = document.createElement('button');
      favButton.setAttribute('data-name', movie.Title);
      favButton.setAttribute('data-oid', movie.imdbID);
      favButton.innerText = "Add to Favorites";
      favButton.addEventListener('click', addFavorite);
      el.appendChild(favButton);
    } else {
      favEl = document.createElement('p');
      favEl.innerText = "This title is in your favorites!";
      el.appendChild(favEl);
    }
  }

  //Sends movie data to add to favorites list via an AJAX POST request
  //upon success, removes the add favorite button
  function addFavorite (event) {
    event.preventDefault();
    var button = event.currentTarget,
        name = button.getAttribute('data-name'),
        oid =  button.getAttribute('data-oid'),
        xhttp = new XMLHttpRequest(),
        urlString = '/favorites/' + oid + '?name=' + name;
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var parentEl = button.parentElement,
            favEl = document.createElement('p'),
            content = document.getElementById('content');
        button.remove();
        favEl.innerText = "This title is in your favorites!";
        parentEl.appendChild(favEl);
      }
    };
    xhttp.open('post', urlString);
    xhttp.send();
  }

  //AJAX request to local backend for favorites data. Once request is
  //complete and data is received, showFavorites method is called
  function getFavorites (event) {
    event.preventDefault();
    var xhttp = new XMLHttpRequest(),
        cache = document.getElementById('content').innerHTML;
    xhttp.responseType = 'json';
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var favorites = xhttp.response;
        showFavorites(favorites, cache);
      }
    };
    xhttp.open('GET', '/favorites');
    xhttp.send();
  }

  //adds the DOM elements and data to show favorites. adds event listener
  //to each favorite to link to a detailed view
  function showFavorites (favorites) {
    var favList = document.createElement('ol'),
        content = document.getElementById('content'),
        newLi, newA;
    content.innerHTML = '';
    favorites.forEach (function (favorite){
      newLi = document.createElement('li');
      newA = document.createElement('a');
      newA.innerHTML = favorite.name;
      newA.setAttribute('data-movieid', favorite.oid);
      newA.href = '#';
      newA.addEventListener('click', getMovieDetails);
      newLi.appendChild(newA);
      favList.appendChild(newLi);
    });
    content.appendChild(favList);
  }
}
