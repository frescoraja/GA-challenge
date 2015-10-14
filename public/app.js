function movieApp () {
  //First, let's listen for search queries from the text input field..
  var searchInput = document.getElementById('search-form');
  searchInput.addEventListener('submit', searchOMDB);

  var favLink = document.getElementById('fav-link');
  favLink.addEventListener('click', getFavorites);

  //When a user submits a search query, we need to submit an AJAX to the
  //appropriate API endpoint to get our search results.. Results will be
  //in JSON format, and are passed as parameters to the updateResults function
  //when the AJAX request is completed successfully.
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

  //Here we clear out the main DIV#content and fill it with our search results.
  //For each result, we build an ordered list and each <li> gets the movie's
  //poster image and a details link showing the title and year of the movie.
  //The link will have a data attribute of the movie's id, and we add
  //an even listener so that when the user clicks on a movie's detail link,
  //we can use that id to query the OMDB for the specific movie's information.
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
      if (movie.Poster !== 'N/A') {
        newImg.src = movie.Poster;
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

  function showMovieDetails (movie) {
    var content = document.getElementById('content'),
        movieTable = document.createElement('table');
    content.innerHTML = '';
    getFavButton(content, movie);
    if (movie.Poster !== 'N/A') {
      newImg = document.createElement('img');
      newImg.src = movie.Poster;
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

  function addFavorite (event) {
    event.preventDefault();
    var button = event.currentTarget,
        name = button.getAttribute('data-name'),
        oid =  button.getAttribute('data-oid'),
        xhttp = new XMLHttpRequest(),
        urlString = '/favorites/' + oid + '?name=' + name;
    xhttp.onreadystatechange = function (id) {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        button.remove();
        var favEl = document.createElement('p'),
            content = document.getElementById('content');
        favEl.innerText = "This title is in your favorites!";
        content.appendChild(favEl);
      }
    };
    xhttp.open('get', urlString);
    xhttp.send();
  }

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
}
