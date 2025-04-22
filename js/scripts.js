// CONFIGURATION
const sheetId = '1fMXuc1NynI3IncXzPLefj2OETDnF0NGAVKqIojP-GlY'; // Google Sheets ID
const apiKey = 'AIzaSyA54V9Ype7Gkw71MfEVMEYjjdkJKF0w2ac'; // Google Sheets API Key
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`; // API URL

const inputLocation = document.getElementById('locationInput');
const detectLocation = document.getElementById('detectLocation');
const mostRecentRows = []

let currentSortColumn = null; // Sorting column
let currentSortOrder = 'asc'; // Sorting order
let userLat = null; // User-provided latitude
let userLong = null; // User-provided longitude

// DOM INITIALISATION
document.addEventListener('DOMContentLoaded', async () => {  
  console.log("On the tee - kiwifairways.co.nz 🏌️‍♂️🏌️‍♀️");
  
  const courseData = await fetchCourseData(); // Wait for course data before proceeding
  renderCourseData(courseData); // Display the course data
  populateFilters(mostRecentRows); // Populate dropdown filters for regions and holes
  addEventListeners(); // Add event listeners for sorting and filtering
  
  locationIcon.addEventListener('click', handleLocationIcon); // Detect user location when the 📍 icon is clicked

});

// FETCH COURSE DATA
function fetchCourseData() {
  console.log("fetchCourseData()");
  return fetch(url)
    .then(response => response.json()) // Fetch the data from Google Sheets API
    .then(data => {
      const headers = data.values[0]; // Use the first row as headers
      const rows = data.values.slice(1); // Use the rest of the rows for data
      const groupedRows = groupByCourseName(rows); // Group rows by course name
      const mostRecentRows = getMostRecentRows(groupedRows); // Get most recent rows for each course
      courseData = mostRecentRows; // Store in global variable
      return mostRecentRows;
    })
    .catch(error => {
      console.error(`Error fetching course data: ${error}`);
      return []; // Return empty array in case of error
    });
}

// GROUP ROWS BY COURSE NAME 
function groupByCourseName(rows) {
  console.log("groupByCourseName()"); 
  return rows.reduce((acc, row) => {
    const courseName = row[1]; // Column index for course name
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(row);
    return acc;
  }, {});
}

// GET THE MOST RECENT ROW FOR EACH COURSE FOR TABLE DATA
function getMostRecentRows(groupedRows) {
  console.log("getMostRecentRows()"); 
  for (const courseName in groupedRows) {
    const rows = groupedRows[courseName];
    const mostRecentRow = rows.reduce((latestRow, currentRow) => {
      const latestDate = parseDate(latestRow[10]); // 'lastUpdated' column
      const currentDate = parseDate(currentRow[10]);
      return currentDate > latestDate ? currentRow : latestRow;
    });

    mostRecentRows.push(mostRecentRow);
  }
  return mostRecentRows;
}

// RENDER COURSE DATA
function renderCourseData(rows) {
  console.log("renderCourseData()");  
  console.log(`Rendering table with userLat: ${userLat}, userLng: ${userLong})`);

  const tableBody = document.querySelector('#myTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  // Add "Distance" column header if user's location is known
  const tableHeadRow = document.querySelector('#myTable thead tr');
  const existingDistanceHeader = document.getElementById('distanceHeader');
  
  console.log(`Determining if distance column should be displayed (userLat: ${userLat}, userLng: ${userLong})`);
  
  // Only remove existing distance header if we don't have location data
  if (!userLat || !userLong) {
    if (existingDistanceHeader) {
      existingDistanceHeader.remove();
    }
  } else if (!existingDistanceHeader) {
    // If we have location data but no header yet, create it
    const th = document.createElement('th');
    th.textContent = 'Distance';
    th.id = 'distanceHeader';
    th.classList.add('sortable');
    th.dataset.column = 'distance';
    
    th.addEventListener('click', () => { // Add click handler for sorting
      if (currentSortColumn === 'distance') {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = 'distance';
        currentSortOrder = 'asc';
      }
      sortTable('distance');
    });
    tableHeadRow.appendChild(th);

  }
  
  // Keep track of total and visible rows
  let totalRowsCount = rows.length;
  let visibleRowsCount = 0;
  
  // Render each row
  rows.forEach(row => {
    const tr = document.createElement('tr'); // Create a new table row

    // Add normal cells from the data
    row.forEach((cell, i) => {
      const td = document.createElement('td'); // Create a table data cell

      // Make website column clickable
      if (i === 4 && cell) {
        const link = document.createElement('a');
        link.href = cell;
        link.textContent = cell;
        link.target = '_blank';
        td.appendChild(link);
      } else {
        td.textContent = cell; // Regular cell content
      }

      tr.appendChild(td); // Add cell to row
    });

    // Add the distance column data if user's location is available
    if (userLat && userLong) {
      const gpsCell = row[11]; // Get GPS data from 12th column of Google sheet  
      
      if (gpsCell) { // Check that GPS data exists
        const [lat, lng] = gpsCell.split(',').map(Number); // Parse latitude and longitude
        
        if (!isNaN(lat) && !isNaN(lng)) { // Make sure we have valid coordinates
          const distance = getDistance(userLat, userLong, lat, lng).toFixed(2); // Calculate distance
          const distanceCell = document.createElement('td');
          distanceCell.textContent = `${distance} km`; // Display distance in km
          distanceCell.classList.add('distance-cell'); // Add a class for easier identification
          distanceCell.dataset.value = distance; // Add raw value for sorting
          tr.appendChild(distanceCell); // Add distance cell to row
        } else {
          // Add empty cell if coordinates are invalid
          const distanceCell = document.createElement('td');
          distanceCell.textContent = 'N/A';
          distanceCell.classList.add('distance-cell');
          tr.appendChild(distanceCell);
        }
      } else {
        // Add empty cell if no GPS data
        const distanceCell = document.createElement('td');
        distanceCell.textContent = 'N/A';
        distanceCell.classList.add('distance-cell');
        tr.appendChild(distanceCell);
      }
    }

    tableBody.appendChild(tr); // Add row to table body
    visibleRowsCount++;
  });

  // Re-apply filtering and distance calculation after rendering
  filterTable(); // Apply filtering to the table
}

// PARSE DATES
function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date) ? new Date(0) : date; // If invalid date, return epoch
}


// POPOULATE HOLES AND REGIONS FILTERS
function populateFilters(rows) {
  console.log("populateFilters()"); 
  const uniqueRegions = new Set();
  const uniqueHoles = new Set();

  rows.forEach(row => {
    uniqueRegions.add(row[0]); // Region
    uniqueHoles.add(row[2]);   // Holes
  });

  populateFilter('regionFilter', uniqueRegions); // Populate region filter
  populateFilter('holesFilter', uniqueHoles);   // Populate holes filter
}

// ???
function populateFilter(selectId, values) {
  console.log("populateFilter()"); 
  const select = document.getElementById(selectId);
  [...values].sort().forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option); // Add each option to select element
  });
}

// FILTER THE TABLE WHEN REQUESTED
function filterTable() {
  console.log("filterTable()"); 
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const selectedRegion = document.getElementById('regionFilter').value;
  const selectedHoles = document.getElementById('holesFilter').value;

  const rows = document.querySelectorAll('#myTable tbody tr');
  let visibleRowsCount = 0;
  const totalRowsCount = rows.length;
  

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const rowText = cells.map(cell => cell.textContent.toLowerCase()).join(' ');
    const region = cells[0].textContent;
    const holes = cells[2].textContent;

    const matchesSearch = rowText.includes(searchValue);
    const matchesRegion = !selectedRegion || region === selectedRegion;
    const matchesHoles = !selectedHoles || holes === selectedHoles;

    const shouldShow = matchesSearch && matchesRegion && matchesHoles;

    row.style.display = (matchesSearch && matchesRegion && matchesHoles) ? '' : 'none';
    if (shouldShow) visibleRowsCount++;
  });

  // Recalculate distances for filtered rows after search
  if (userLat && userLong) {
    const filteredRows = Array.from(document.querySelectorAll('#myTable tbody tr')).filter(row => row.style.display !== 'none');
    filteredRows.forEach(row => {
      const gpsCell = row.querySelector('td:nth-child(13)');
      if (gpsCell && gpsCell.textContent.includes(',')) {
        const [lat, lng] = gpsCell.textContent.split(',').map(Number);
        const distance = getDistance(userLat, userLng, lat, lng).toFixed(2);

        // Find or create the distance column
        let distanceCell = row.querySelector('td:nth-child(14)');
        if (!distanceCell || gpsCell === distanceCell) {
          distanceCell = document.createElement('td');
          row.appendChild(distanceCell);
        }

        distanceCell.textContent = `${distance} km`;
      }
    });
  }
  // Update the visible row count
  const rowCountDisplay = document.getElementById('rowCount');
  if (rowCountDisplay) {
    rowCountDisplay.innerText = `Showing ${visibleRowsCount} of ${totalRowsCount} courses`;
  }
}

// MAKE TABLE HEADERS CLICKABLE & TABLE SORTABLE
function addEventListeners() {
  console.log("addEventListeners()"); 
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.column;
      if (column === currentSortColumn) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
      } else {
        currentSortColumn = column;
        currentSortOrder = 'asc'; // Set default sort order to ascending
      }
      sortTable(column); // Sort the table based on the selected column
    });
  });

  // Hook up filters and search
  document.getElementById('searchInput').addEventListener('input', filterTable);
  document.getElementById('regionFilter').addEventListener('change', filterTable);
  document.getElementById('holesFilter').addEventListener('change', filterTable);

  // Autocomplete input
  setupLocationAutocomplete(); // Set up location autocomplete feature
}

// DETERMINE COLUMN INDEX (NOT SURE WHY...)
function getColumnIndex(column) {
  console.log("getColumnIndex()"); 
  if (column === 'distance') {
    // Return the last column index 
    const headerCount = document.querySelectorAll('#myTable thead th').length;
    return headerCount;
  }
  switch (column) {
    case 'region': return 1;
    case 'courseName': return 2;
    case 'holes': return 3;
    case 'slope': return 4;
    case 'website': return 5;
    case 'gf': return 6;
    case 'gfAffiliated': return 7;
    case 'membership': return 8;
    case 'members': return 9;
    case 'notes': return 10;
    case 'lastUpdated': return 11;
    case 'gps': return 12;
    default: return 1;
  }
}

// SORT THE TABLE BASED ON USER INTERACTION 
function sortTable(column) {
  console.log(`sortTable() by '${column}' column, ${currentSortOrder}`);


  const rows = Array.from(document.querySelectorAll('#myTable tbody tr'));

  const sortedRows = rows.sort((a, b) => {
    // Get all cells in each row
    const cellsA = a.querySelectorAll('td');
    const cellsB = b.querySelectorAll('td');
    
    // Special handling for distance column - always use the last cell
    if (column === 'distance') {
      const distanceCellA = cellsA[cellsA.length - 1].textContent.trim();
      const distanceCellB = cellsB[cellsB.length - 1].textContent.trim();
      
      const numA = parseFloat(distanceCellA.replace('km', '').trim()) || 0;
      const numB = parseFloat(distanceCellB.replace('km', '').trim()) || 0;
      
      return currentSortOrder === 'asc' ? numA - numB : numB - numA;
    }
    
    // For other columns, use the column index approach
    const colIndex = getColumnIndex(column);
    const cellA = cellsA[colIndex - 1]?.textContent.trim() || '';
    const cellB = cellsB[colIndex - 1]?.textContent.trim() || '';

    // Numeric columns
    if (column === 'holes' || column === 'slope' || column === 'gf' || column === 'gfAffiliated' || column === 'membership' || column === 'members') {
      // Remove dollar signs and other non-numeric characters
      const numA = parseFloat(cellA.replace(/[^0-9.]/g, '')) || 0;
      const numB = parseFloat(cellB.replace(/[^0-9.]/g, '')) || 0;
      return currentSortOrder === 'asc' ? numA - numB : numB - numA;
    }

    // Fallback for string sorting
    return currentSortOrder === 'asc'
      ? cellA.localeCompare(cellB)
      : cellB.localeCompare(cellA);
  });

  // Clear sorting indicators from all headers
  document.querySelectorAll('#myTable th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
  });
  
  // Add sorting indicator to current column
  const currentHeader = document.querySelector(`#myTable th[data-column="${column}"]`);
  if (currentHeader) {
    currentHeader.classList.add(`sorted-${currentSortOrder}`);
  }

  // Reorder the table
  const tableBody = document.querySelector('#myTable tbody');
  
  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  sortedRows.forEach(row => fragment.appendChild(row));
  
  tableBody.innerHTML = '';
  tableBody.appendChild(fragment);
}

// LOCATION AUTOCOMPLETE (PHOTON)
function setupLocationAutocomplete() {
  console.log("setupAutoComplete()"); 
  const input = document.getElementById('locationInput');
  const suggestionBox = document.getElementById('locationSuggestions');

  input.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) {
      suggestionBox.innerHTML = '';
      return;
    }

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=166.5,-47.5,179.5,-34.0`);
      const data = await res.json();

      suggestionBox.innerHTML = ''; // Clear suggestions

      data.features.forEach(feature => {
        const name = feature.properties.name;
        const city = feature.properties.city || '';
        
        // Create label without the country part
        let fullLabel;
        if (city && city !== name) {
          fullLabel = `${name}, ${city}`;
        } else {
          fullLabel = name;
        }
        
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];

        userLat = feature.geometry.coordinates[1];
        userLong = feature.geometry.coordinates[0];   
        
        renderCourseData(mostRecentRows);

        // Sort by distance immediately after rendering
        currentSortColumn = 'distance';
        currentSortOrder = 'asc'; // Shortest distance at top
        sortTable('distance');

        const item = document.createElement('div');
        item.textContent = fullLabel;
        item.classList.add('suggestion-item');
        item.addEventListener('click', () => {
          input.value = fullLabel; // Set input value to selected location
          suggestionBox.innerHTML = '';
          //sortCoursesByDistance(lat, lng); // Sort courses by proximity to selected location
        });

        suggestionBox.appendChild(item); // Add suggestion to list
      });
    } catch (err) {
      console.error('Photon autocomplete error:', err); // Handle errors
    }
  });
}

// HANDLE LOCATION ICON INTERACTION
function handleLocationIcon() {
  console.log("handleLocationIcon()"); 
  if (locationIcon.innerHTML === '📍') { // Location pin clicked
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLat = position.coords.latitude;
          userLong = position.coords.longitude;
          console.log(`User location detected successfully: ${userLat},${userLong}`);

          // Update the location input field
          locationInput.value = 'My Location';

          // Change the location icon to a clear icon
          locationIcon.innerHTML = '&#x274C;'; // ❌

          // Now call the dedicated handler
          //handleLocationChange(userLat, userLong);
          renderCourseData(mostRecentRows);

          // Add the class to show distance column
          document.querySelector('#myTable').classList.add('show-distance');

          // Sort by distance immediately after rendering
          currentSortColumn = 'distance';
          currentSortOrder = 'asc'; // Shortest distance at top
          sortTable('distance');

        },
        (error) => {
          console.error('Geolocation error:', error.message);
          alert('Unable to retrieve your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }

  } else { // Cross (❌) clicked
    
    // Clear the users location
    userLat = null;
    userLong = null;

    // Clear the location input field
    locationInput.value = '';

    // Change the icon back to location pin
    locationIcon.innerHTML = '📍';

    // Remove the class to hide distance column
    document.querySelector('#myTable').classList.remove('show-distance');

    renderCourseData(mostRecentRows);
  }
  
};

// Sort visible courses by proximity to given lat/lng
function sortCoursesByDistance(userLat, userLng) {
  console.log("sortCoursesByDistance()"); 
  const rows = Array.from(document.querySelectorAll('#myTable tbody tr'));
  const rowsWithDistance = rows.map(row => {
  // Find the GPS cell (typically the cell before the last one if distance is present)
  const cells = row.querySelectorAll('td');
  const gpsCell = cells[cells.length - 2]; // Second-to-last cell is GPS when distance is present
    
  // Parse GPS coordinates
  if (gpsCell && gpsCell.textContent.includes(',')) {
    const [lat, lng] = gpsCell.textContent.trim().split(',').map(Number);
    const distance = getDistance(userLat, userLng, lat, lng).toFixed(2);
    return { row, distance: parseFloat(distance) };
  }
    
  return { row, distance: Infinity }; // Handle rows without valid GPS data
  });

  const sortedRows = rowsWithDistance.sort((a, b) => a.distance - b.distance);

  const tableBody = document.querySelector('#myTable tbody');
  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  sortedRows.forEach(item => fragment.appendChild(item.row));
  
  tableBody.innerHTML = '';
  tableBody.appendChild(fragment);
}

// HAVERSINE FORMULA TO CALCULATE DISTANCE
function getDistance(lat1, lng1, lat2, lng2) {
  console.log("getDistance()"); 
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

