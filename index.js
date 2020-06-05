(() => {
  // Declaring two cache arrays which will be used to store data from the server
  let coinsArray = new Array();
  let moreInfoArray = new Array();

  $(() => {
    // Retrieves a list of coins from the server on load
    retrieveCoinsList(coinsArray, moreInfoArray);

    // On home button clicked, display home page
    onHomeButtonClicked(coinsArray, moreInfoArray);

    // On submit of the search form, displays the searched coin if founds
    onSearchButtonClicked(coinsArray, moreInfoArray);

    // On live reports button clicked, display live reports graph
    onLiveReportsButtonClicked(coinsArray);

    // On about button clicked, display about page
    onAboutButtonClicked();

    // On view checked coins button clicked, display modal with all checked coins
    onViewCheckedCoinsClicked();
  });
})();

/**
 * On view checked coins button clicked, display modal with all checked coins
 */
function onViewCheckedCoinsClicked() {
  $("#viewCheckedCoinsButton").click(() => {
    onModalToggled("Checked Coins List: ");

    // If the graph is displayed, the user will be sent back to the home page
    if ($(".chartContainer").length === 1) {
      $("#homeButton").click();
    }
  });
}

/**
 * On about button clicked, display about page
 */
function onAboutButtonClicked() {
  $("#aboutButton").click(() => {
    let targetElement = ".containerDiv";
    initTargetElement(targetElement);

    $("#aboutSection").show();
  });
}

/**
 * On home button clicked, display home page
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function onHomeButtonClicked(coinsArray, moreInfoArray) {
  $("#homeButton").click(() => {
    if (coinsArray.length === 0) {
      let targetElement = ".containerDiv";
      initTargetElement(targetElement);

      retrieveCoinsList(coinsArray, moreInfoArray);
    } else {
      onSuccessfullCoinListRetrieval(coinsArray, moreInfoArray);
    }
  });
}

/**
 * On submit of the search form, begin searching for the asked coin
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function onSearchButtonClicked(coinsArray, moreInfoArray) {
  $("#searchButton").click((event) => {
    event.preventDefault();

    let searchQuery = $("#searchInput").val();
    if (isSearchQueryValid(searchQuery)) {
      let cachedCoin = getCoinFromCacheBySymbol(searchQuery, coinsArray);
      if (isCachedCoinDefined(cachedCoin)) {
        onSuccessfullCoinListRetrieval([cachedCoin], moreInfoArray);
      } else {
        onModalToggled(
          "The requested coin was not found",
          null,
          "Please make sure it was typed correctly..."
        );
      }
    } else {
      onModalToggled(
        "Invalid Input!",
        null,
        "Please enter a valid search query..."
      );
    }
  });
}

/**
 * On live reports button clicked, display live reports graph
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 */
function onLiveReportsButtonClicked(coinsArray) {
  $("#liveReportsButton").click(() => {
    let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));

    if (checkedIDArray && checkedIDArray.length !== 0) {
      let coins = new Array();

      checkedIDArray.forEach((item) =>
        coins.push(getCoinFromCacheByID(item, coinsArray))
      );

      displayLiveReports(coins);
    } else {
      onModalToggled("Error!", null, "No coins were selected!");
    }
  });
}

/**
 * Retrieves 100 coins from the server, and passes on two arrays for use of caching
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
async function retrieveCoinsList(coinsArray, moreInfoArray) {
  let targetElement = ".containerDiv";
  displayLoadingAnimation(targetElement);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/list`;
    const response = await AjaxRequestPromise(url);
    initTargetElement(targetElement);
    processCoinsListResponse(response, coinsArray, moreInfoArray);

    $("#liveReportsButton").prop("disabled", false);
    $("#aboutButton").prop("disabled", false);
    $("#viewCheckedCoinsButton").prop("disabled", false);
  } catch (error) {
    displayErrorMessage(error, targetElement);
    $("#aboutButton").prop("disabled", false);
  }
}

/**
 * On successful retrieval of data, initiate success function once process is finished
 * @param {Array} data - An array of data from the server
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function processCoinsListResponse(data, coinsArray, moreInfoArray) {
  let counter = 0;
  for (let index = 750; index < 850 + counter; index++) {
    // Validates that the current coin's symbol doesn't match the previous one, which occurs often
    // Due to the fact that in live reports you can only search by symbol (API's limitation)
    if (index >= 751 && data[index - 1].symbol === data[index].symbol) {
      counter++;
      continue;
    }
    coinsArray[index - 750 - counter] = data[index];
  }
  onSuccessfullCoinListRetrieval(coinsArray, moreInfoArray);

  if (handleCheckedCoinsPullingAndReturnIfFound(coinsArray) === false) {
    let message =
      "Some of your checked coins from your last session were not found and therefore removed.";
    onModalToggled("Hey!", null, message);
  }
}

/**
 * Validates if checked coins from previous sessions are found in the current data pool
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 */
function handleCheckedCoinsPullingAndReturnIfFound(coinsArray) {
  let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));

  if (checkedIDArray && checkedIDArray.length !== 0) {
    let coinsMissing = 0;
    // Iterate through the coins saved in localStorage array
    checkedIDArray.forEach((item) => {
      let counter = 0;
      for (let index = 0; index < coinsArray.length && counter === 0; index++) {
        if (item === coinsArray[index].id) {
          counter = counter + 1;
        }
        if (index === coinsArray.length - 1 && counter === 0) {
          // If not found, then the ID will be removed from localStorage
          removeFromLocalStorage(item);
          coinsMissing = coinsMissing + 1;
        }
      }
    });

    if (coinsMissing > 0) {
      return false;
    }
    return true;
  }
}

/**
 * Validates that the user did not search for an empty query
 * @param {String} value - The user's search query
 */
function isSearchQueryValid(value) {
  if (!value || value.trim() === "") {
    return false;
  }
  return true;
}

/**
 * Validates that the coin the user seeked, is actually defined
 * @param {Object} object - Coin object
 */
function isCachedCoinDefined(object) {
  if (!object) {
    return false;
  }
  return true;
}

/**
 * Success function which handles the display process of every coin inside coinsArray
 * @param {Array} coinsArray - An array used to store the list of coins retrieved from the server
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function onSuccessfullCoinListRetrieval(coinsArray, moreInfoArray) {
  let targetElement = ".containerDiv";
  initTargetElement(targetElement);

  coinsArray.forEach((item) => {
    let container = createCoinElementsObject(item, moreInfoArray);
    appendCoinElements(container, targetElement);
  });
}

/**
 * Setting an on-click function for 'Show more info' button, if the coin isn't cached
 * then another server retrieval function will be called
 * @param {String} coinID - The ID of the coin
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function onShowMoreInfoClicked(coinID, moreInfoArray) {
  let coin = getCoinFromCacheByID(coinID, moreInfoArray);

  if (!coin) {
    showMoreInfoCoin(coinID, moreInfoArray);
  } else {
    displayCoinCurrentValues(coin);
  }
}

/**
 * Iterates through the given array by ID using the map method in order to retrieve the cached coin
 * @param {String} coinID - The ID of the coin
 * @param {Array} cacheArray - Any given array which is sent as a parameter
 */
function getCoinFromCacheByID(coinID, cacheArray) {
  let cachedCoin;
  cacheArray.forEach((item) => {
    if (item.id === coinID) {
      cachedCoin = item;
    }
  });
  return cachedCoin;
}

/**
 * Iterates through the given array by the coin's Symbol to check if it matches the
 * search query using the map method in order to retrieve the cached coin
 * @param {String} searchQuery - The user's search query
 * @param {Array} cacheArray - Any given array which is sent as a parameter
 */
function getCoinFromCacheBySymbol(searchQuery, cacheArray) {
  let cachedCoin;
  cacheArray.forEach((item) => {
    if (item.symbol === searchQuery) {
      cachedCoin = item;
    }
  });
  return cachedCoin;
}

/**
 * Retrieves data from the given URL
 * @param url - The URL which we need to get data from
 */
function AjaxRequestPromise(url) {
  return new Promise((resolve, reject) => {
    $.get(url)
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("Connection Failed!");
      });
  });
}

/**
 * On successful retrieval of additional data on the specific coin, a function which will
 * process the data will initiate. Otherwise, an error message will be displayed
 * @param {String} coinID - The ID of the coin
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
async function showMoreInfoCoin(coinID, moreInfoArray) {
  displayLoadingAnimation(`#span${coinID}`);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinID}`;
    const response = await AjaxRequestPromise(url);
    processMoreInfoResponse(moreInfoArray, response);
  } catch (error) {
    displayErrorMessage(error, `#span${coinID}`);
  }
}

/**
 * Handles the process of the additional coin information (data) retrieved
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 * @param {Array} data - Additional data on the specific coin from the server
 */
function processMoreInfoResponse(moreInfoArray, data) {
  let coinObject = createCoinInfoObject(data);
  coinObject = validateCoinValues(coinObject);

  moreInfoArray.push(coinObject);
  initCacheCleanUp(coinObject.id, moreInfoArray);

  displayCoinCurrentValues(coinObject);
}

/**
 * Validates that the retrieved coin from the server actually has defined values.
 * A bug I've encountered, retrieving a value of 0.0 is considered "undefined"
 * @param {Object} coinObject - contains all values regarding the specific coin
 */
function validateCoinValues(coinObject) {
  if (
    coinObject.usd === undefined ||
    coinObject.eur === undefined ||
    coinObject.ils === undefined
  ) {
    coinObject.usd = 0;
    coinObject.eur = 0;
    coinObject.ils = 0;
  }

  return coinObject;
}

/**
 * Returns an object containing all the necessary information about the specific coin
 * @param {Object} data - Additional data on the specific coin from the server
 */
function createCoinInfoObject(data) {
  return {
    usd: data.market_data.current_price.usd,
    eur: data.market_data.current_price.eur,
    ils: data.market_data.current_price.ils,
    logo: data.image.small,
    id: data.id,
  };
}

/**
 * Initializes an imminent cleanup on each coin, the coin will be removed from the cached array
 * 2 minutes after its initial save
 * @param {String} coinID - The ID of the coin
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function initCacheCleanUp(coinID, moreInfoArray) {
  setTimeout(() => {
    moreInfoArray.forEach((item) => {
      if (item.id === coinID) {
        let index = moreInfoArray.indexOf(item);
        if (index !== -1) {
          moreInfoArray.splice(index, 1);
        }
      }
    });
  }, 120000);
}

/**
 * Displays the given error message on the specified target element
 * @param {String} message - Any error message
 * @param {String} target -  An identification of the element on which the error will be displayed
 */
function displayErrorMessage(message, target) {
  let targetElement = initTargetElement(target);
  $(targetElement)
    .append(`<span id='errorSpan'> ${message}`)
    .addClass("errorClass");
}

/**
 * Initializes the targeted element which is identified by the parameter's value
 * @param {String} target - An identification of the element
 */
function initTargetElement(target) {
  $("#aboutSection").hide();
  $(target).removeClass("errorClass").empty();
  return target;
}

/**
 * Displays the values of the coin the user asked to show more info of
 * @param {Object} coinObject - An object that contains dditional data on the specific coin
 */
function displayCoinCurrentValues(coinObject) {
  let targetElement = initTargetElement(`#span${coinObject.id}`);

  $(targetElement).append(
    `USD: ${coinObject.usd}$ <br/>EUR: ${coinObject.eur}€ <br/>ILS: ${coinObject.ils}‏₪ <br/>`,
    $(`<img src=${coinObject.logo}>`).addClass("coinLogo")
  );
}

/**
 * Displays a loading animation on a specific element, indetified by the given parameter
 * @param {String} targetID - An identification of the element
 */
function displayLoadingAnimation(targetID) {
  if (targetID === ".containerDiv") {
    $(targetID).append(
      `<img id='pageLoader' src='./media/ajax-PageLoader.gif'>`
    );
  } else {
    if ($(`${targetID} > *`).length < 1) {
      $(targetID).append(`<img src='./media/ajax-loader.gif'>`);
    }
  }
}

/**
 * Returns an object which contains all elements regarding each coin displayed on the screen
 * @param {Object} coin - An object which contains the coin values
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function createCoinElementsObject(coin, moreInfoArray) {
  // Varying class name which I added in order to identify between toggles on page, to toggle inside the modal
  // The toggles inside the modal will have a different class name which will help in identifying them
  let className = "switch";

  return {
    card: $("<div>").addClass("card"),
    cardBody: $("<div>").addClass("card-body"),
    header: $("<h5>").addClass("card-title").text(coin.symbol),
    nameSpan: $("<p>").addClass("card-text nameClass").text(coin.name),
    collapsibleDiv: $(`<div id=collapse${coin.id}>`).addClass("collapse"),
    valuesSpan: $(`<span id=span${coin.id}>`).addClass("coinValuesSpan"),
    button: createMoreInfoButton(coin.id, moreInfoArray).text("Show More Info"),
    toggleSwitch: createToggleSwitch(coin.id, className),
  };
}

/**
 * Returns a 'Show More Info' button which targets a collapsible div
 * @param {String} coinID - The ID of the coin
 * @param {Array} moreInfoArray - An array used for caching extra info on clicked coins
 */
function createMoreInfoButton(coinID, moreInfoArray) {
  return $(
    `<button data-toggle='collapse' id=${coinID} data-target='#collapse${coinID}' aria-expanded='false'>`
  )
    .addClass("btn btn-sm btn-primary showMoreInfoButton")
    .click(function () {
      // On-click function only occurs when the collapsible Div is closed, and the click opens it
      if ($(`#collapse${coinID}`).hasClass("show") === false) {
        onShowMoreInfoClicked(coinID, moreInfoArray);
      }
    });
}

/**
 * Returns a toggle switch to the function from which it has been called
 * @param {String} coinID - The ID of the coin
 * @param {String} labelClassName - Varing class name, depends on the need
 */
function createToggleSwitch(coinID, labelClassName) {
  return $("<label>")
    .addClass(labelClassName)
    .append(
      $(`<input type='checkbox' id=${coinID}>`)
        .prop("checked", isCheckBoxAlreadyChecked(coinID))
        .click(() => {
          onCheckBoxSwitchToggled(coinID, true);
        }),
      $(`<span>`).addClass("slider round")
    );
}

/**
 * Appends all elements to a container div
 * @param {Object} container - object of elements
 * @param {String} targetElement - An identification of the targeted element
 */
function appendCoinElements(container, targetElement) {
  $(container.collapsibleDiv).append(container.valuesSpan);
  $(container.cardBody).append(
    container.toggleSwitch,
    container.header,
    container.nameSpan,
    container.button,
    container.collapsibleDiv
  );
  $(container.card).append(container.cardBody);
  $(targetElement).append(container.card);
}

/**
 * Setting an on-click event for each toggle switch
 * @param {String} coinID - The ID of the coin
 * @param {Boolean} isEventNeeded - Used to decide whether we need to use the event object
 */
function onCheckBoxSwitchToggled(coinID, isEventNeeded) {
  $(`input[id=${coinID}]:checkbox`).on("change", function (event) {
    if (isEventNeeded) {
      // Used in some instances to prevent a propagation bug
      event.stopImmediatePropagation();
    }
    if (this.checked) {
      saveCheckedIDinLocalStorage(this.id);
    } else if (!this.checked) {
      removeFromLocalStorage(this.id);
    }

    limitToggledSwitches(this.id);
  });
}

/**
 * Limits the number of concurrent toggled switches to 5,
 * On the event of a 6th coin toggle attempt, a modal will be toggled
 * @param {String} coinID - The ID of the coin
 */
function limitToggledSwitches(coinID) {
  let checkBox = `input[id=${coinID}]:checkbox`;
  let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));

  // Extra validation
  $(checkBox).prop("checked", isCheckBoxAlreadyChecked(coinID));

  if (
    !$(checkBox).prop("checked") &&
    $("#myModal").hasClass("show") === false &&
    checkedIDArray.length === 5
  ) {
    onModalToggled("You've reached the limit of checked coins!", coinID);
  }
}

/**
 * Saves in localStorage the ID of the toggled checkBox
 * @param {String} checkBoxID - the ID of the toggled checkbox
 */
function saveCheckedIDinLocalStorage(checkBoxID) {
  let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));
  // Using a set to prevent and duplicates
  let checkedIDSet = new Set();

  if (!checkedIDArray || checkedIDArray.length === 0) {
    checkedIDArray = [checkBoxID];
    localStorage.setItem("Checked IDs", JSON.stringify(checkedIDArray));
  } else if (checkedIDArray.length < 5) {
    checkedIDArray.forEach((item) => {
      checkedIDSet.add(item);
    });
    // Adding the last toggled checkbox ID
    checkedIDSet.add(checkBoxID);

    let arrayFromSet = Array.from(checkedIDSet);
    localStorage.setItem("Checked IDs", JSON.stringify(arrayFromSet));
  }
}

/**
 * Removes from localStorage the ID of the untoggled checkBox
 * @param {String} checkBoxID - the ID of the toggled checkbox
 */
function removeFromLocalStorage(checkBoxID) {
  let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));

  checkedIDArray.map((item, index) => {
    if (item === checkBoxID) {
      checkedIDArray.splice(index, 1);
    }
  });
  localStorage.setItem("Checked IDs", JSON.stringify(checkedIDArray));
}

/**
 * Checks if a checkBox has already been checked and stored in localStorage
 * Used as an extra validation which also synchronizes the togglers (when more than one of the same is shown)
 * @param {String} CheckBoxID - the ID of the toggled checkbox
 */
function isCheckBoxAlreadyChecked(CheckBoxID) {
  let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));
  let isFound = false;

  if (!checkedIDArray || checkedIDArray.length === 0) {
    return false;
  }

  checkedIDArray.forEach((item) => {
    if (item === CheckBoxID) {
      isFound = true;
    }
  });
  return isFound;
}

/**
 * A reusable modal whose content varies and depends on the parameters, if no specific message was specified,
 * the modal will attempt to display toggled coins if any
 * @param {String} headerText - A message which will be displayed as the header of the modal
 * @param {Object} sixthCoinID - The ID of the sixth coin
 * @param {String} specifiedMessage - A specific message which if specified will result in the modal only showing this
 */
function onModalToggled(headerText, sixthCoinID, specifiedMessage) {
  $("#modalBody").empty();

  if (specifiedMessage) {
    $("#modalBody").text(specifiedMessage);
  } else {
    let checkedIDArray = JSON.parse(localStorage.getItem("Checked IDs"));

    if (checkedIDArray && checkedIDArray.length !== 0) {
      displayCheckedCoinsInModal(checkedIDArray, sixthCoinID);
    } else {
      $("#modalBody").text(
        "No coins were seleceted! You may go back and select up to 5 coins"
      );
    }
  }

  $("#modalHeader").text(headerText);
  $("#myModal").modal("show");
}

/**
 * Displays all checked coins in modal, if a 6th coin is presented it will also be displayed
 * @param {Array} checkedIDArray - An array which contains all checked coins stored in localStorage
 * @param {String} sixthCoinID - The ID of the sixth coin
 */
function displayCheckedCoinsInModal(checkedIDArray, sixthCoinID) {
  if (sixthCoinID) {
    checkedIDArray[5] = sixthCoinID;
  }

  $("#modalBody").text(
    "You can choose whether you want to uncheck some of them: "
  );

  checkedIDArray.map((checkedID) => {
    let className = "modalSwitch";
    let element = createToggleSwitch(checkedID, className);

    $("#modalBody")
      .append(`<span class='col-9'> ${checkedID}`)
      .append(element)
      .addClass("row");
    $(".modalSwitch > label ").addClass("col-3");

    onCheckBoxSwitchToggled(checkedID, false);
  });
}

/**
 * Displays a live reports graph that tracks all toggled coins
 * @param {Array} coins - An array which contains all checked coins stored in localStorage
 */
function displayLiveReports(coins) {
  if ($(".chartContainer").length === 0) {
    $(".containerDiv").append(
      `<div id="chartContainer" class="chartContainer">`
    );
  }
  onModalToggled("Loading Live Graph", null, "Please wait...");

  let dataPoints = {};

  let options = {
    animationEnabled: true,
    title: {
      text: "Currency to USD",
      fontFamily: "sans-serif",
      fontWeight: 600,
    },
    axisX: {
      title: "Time Lapse (Affected by Slow Connection)",
      labelFontFamily: "Times New Roman",
      titleFontWeight: "bold",
      titleFontSize: 20,
      titleFontColor: "darkred",
      margin: 20,
      labelFontColor: "darkred",
      labelFontSize: 17,
      tickColor: "darkred",
      valueFormatString: "hh:mm:ss",
    },
    axisY: {
      title: "Value In USD ($)",
      titleFontWeight: "bold",
      titleFontSize: 22,
      titleFontColor: "darkblue",
      margin: 10,
      labelFontColor: "darkblue",
      labelFontSize: 17,
      tickColor: "darkblue",
      minimum: 0,
      prefix: "$",
    },
    toolTip: {
      shared: true,
      fontSize: 16,
    },
    legend: {
      cursor: "pointer",
      fontSize: 20,
      verticalAlign: "top",
      fontColor: "dimGrey",
      itemclick: toggleDataSeriesOnClick,
    },
    data: [],
  };

  updateDataPoints();

  /**
   * Returns a duplicate Object that contains all of the necessary values ($)
   * @param {Object} data - An object containing the data retrieved from the server
   * @param {String} valueType - The type of value, for instance: ($)
   */
  function getValuesFromData(data, valueType) {
    let duplicateObj = {};
    // Run over the keys we get from the data object
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        // Mapping the valueType to the currency type.
        duplicateObj[key] = element[valueType];
      }
    }
    return duplicateObj;
  }

  /**
   * Adds the newly retrieved data to the graph
   * @param {Object} data - Contains the data value of each coin that was retrieved from the server
   */
  function addData(data) {
    // Validates if data has been retrieved for all of the checked coins
    if (Object.keys(data).length !== coins.length) {
      for (const [key] of Object.entries(data)) {
        coins.map((item, index) => {
          if (item.symbol === key.toLowerCase()) {
            coins.splice(index, 1);
          }
        });
      }

      let message = `Failed to retrieve live data on the following: ${countCoins(
        0,
        "id"
      )} `;

      // Using regex to add spacing between commas
      onModalToggled(message.replace(/,/g, ", "));
    } else {
      if ($("#chartContainer") && $("#chartContainer").CanvasJSChart()) {
        $(".containerDiv > *").not(".chartContainer").remove();
        $("#aboutSection").hide();
        $(".chartContainer").show();

        // Occurs only once, when graph is loaded
        if (Object.entries(dataPoints).length === 0) {
          onModalToggled("Success!", null, "Graph Loaded Successfully!");
        }

        let mappedData = getValuesFromData(data, "USD");

        //called every 2 seconds
        for (const key in mappedData) {
          if (mappedData.hasOwnProperty(key)) {
            if (!dataPoints[key]) {
              dataPoints[key] = [];
            }
            const value = mappedData[key];
            dataPoints[key].push({ x: new Date(), y: value });
          }
        }

        //Update the options.data with the data
        for (const key in dataPoints) {
          if (dataPoints.hasOwnProperty(key)) {
            const value = dataPoints[key];
            if (options.data.length < Object.entries(dataPoints).length) {
              options.data.push({
                name: key,
                type: "spline",
                showInLegend: true,
                xValueFormatString: "hh:mm:ss",
                dataPoints: value,
              });
            }
          }
        }

        if ($("#chartContainer") && $("#chartContainer").CanvasJSChart()) {
          $("#chartContainer").CanvasJSChart().render();
        }

        // Setting a timeout to update the chart every 2 seconds
        let timeout = setTimeout(updateDataPoints, 2000);

        let selector = ":button";

        // Setting an on-click function to stop the chart from attempting to update when it's removed
        $(selector)
          .unbind("click.timer")
          .bind("click.timer", () => {
            if ($(".chartContainer").length === 0) {
              clearTimeout(timeout);
              $(selector).unbind("click.timer");
            }
          });
      }
    }
  }

  /**
   * Attempts to update data points, on success the data will be added.
   * Otherwise an error message will be displayed
   */
  async function updateDataPoints() {
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${countCoins(
      0,
      "symbol"
    )}&tsyms=USD`;

    try {
      const response = await AjaxRequestPromise(url);
      addData(response);
    } catch (error) {
      clearTimeout(updateDataPoints);
      displayErrorMessage(error, ".containerDiv");
    }
  }

  /**
   * Recursive function which returns every stored coin's symbol
   * @param {Number} counter - Counts the number of coins
   * @param {String} key - An object key whose values are needed
   */
  function countCoins(counter, key) {
    if (coins.length - 1 === counter) {
      return `${coins[counter][key]}`;
    }
    return `${coins[counter][key]},` + countCoins(counter + 1, key);
  }

  $("#chartContainer").CanvasJSChart(options);

  /**
   * Toggles the visiblity of data on-click (on each data label)
   * @param {Object} e - Event object
   */
  function toggleDataSeriesOnClick(e) {
    if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
      e.dataSeries.visible = false;
    } else {
      e.dataSeries.visible = true;
    }
    e.chart.render();
  }
}
