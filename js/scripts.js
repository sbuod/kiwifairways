// =======================
// CONFIGURATION
// =======================
const sheetId = '1fMXuc1NynI3IncXzPLefj2OETDnF0NGAVKqIojP-GlY'; // Google Sheets ID
const apiKey = 'AIzaSyA54V9Ype7Gkw71MfEVMEYjjdkJKF0w2ac'; // Google Sheets API Key
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`; // API URL

// Sorting state
let currentSortColumn = null;
let currentSortOrder = 'asc';

// User's location (for distance calculation)
let userLat = null;
let userLng = null;

// =======================
// FETCH & RENDER DATA
// =======================
fetch(url)
  .then(response => response.json()) // Fetch the data from Google Sheets API
  .then(data => {
    const headers = data.values[0]; // First row as headers
    const rows = data.values.slice(1); // Data rows excluding headers
    const groupedRows = groupByCourseName(rows); // Group rows by course name
    const mostRecentRows = getMostRecentRows(groupedRows); // Get most recent rows for each course

    renderTable(mostRecentRows); // Render the table with the data
    populateFilters(mostRecentRows); // Populate dropdown filters for regions and holes
    addEventListeners(); // Add event listeners for sorting and filtering
  })
  .catch(error => console.error('Error fetching data:', error));

// =======================
// RENDER TABLE ROWS
// =======================
function renderTable(rows) {
  console.log("renderTable()");  
  console.log("Rendering table with userLat:", userLat, "userLng:", userLng);

  const tableBody = document.querySelector('#myTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  // Add "Distance" column header if user's location is known
  const tableHeadRow = document.querySelector('#myTable thead tr');
  const existingDistanceHeader = document.getElementById('distanceHeader');
  console.log("Before distance calc - userLat:", userLat, "userLng:", userLng);
  
  if (userLat && userLng && !existingDistanceHeader)   {
    const th = document.createElement('th');
    th.textContent = 'Distance';
    th.id = 'distanceHeader';
    th.classList.add('sortable');
    th.dataset.column = 'distance';
    th.addEventListener('click', () => { // Add click handler directly
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
  
  rows.forEach(row => {
    const tr = document.createElement('tr'); // Create a new table row

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

    // Add the distance column if user's location is available
    console.log(userLat, userLng)
    if (userLat && userLng) {
      const gpsCell = row[11]; // Get GPS data from 12 th column of Google sheet
      console.log("GPS Cell:", gpsCell);
      
      const [lat, lng] = gpsCell.split(',').map(Number); // Parse latitude and longitude
      const distance = getDistance(userLat, userLng, lat, lng).toFixed(2); // Calculate distance

      const distanceCell = document.createElement('td');
      distanceCell.textContent = `${distance} km`; // Display distance in km
      distanceCell.classList.add('distance-cell'); // Add a class for easier identification
      tr.appendChild(distanceCell); // Add distance cell to row
    }

    tableBody.appendChild(tr); // Add row to table body
  });

  // Re-apply filtering and distance calculation after rendering
  filterTable(); // Apply filtering to the table
}

// =======================
// GROUP & FILTER LOGIC
// =======================

// Group rows by course name
function groupByCourseName(rows) {
  console.log("groupByCourseName()"); 
  return rows.reduce((acc, row) => {
    const courseName = row[1]; // Column index for course name
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(row);
    return acc;
  }, {});
}

// Get the most recent row for each course
function getMostRecentRows(groupedRows) {
  console.log("getMostRecentRows()"); 
  const mostRecentRows = [];

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

// Parse a date string safely
function parseDate(dateString) {
  console.log("parseDate()"); 
  const date = new Date(dateString);
  return isNaN(date) ? new Date(0) : date; // If invalid date, return epoch
}

// =======================
// FILTERING
// =======================

// Populate dropdown filters
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

// Helper to populate a dropdown
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

function filterTable() {
  console.log("filterTable()"); 
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const selectedRegion = document.getElementById('regionFilter').value;
  const selectedHoles = document.getElementById('holesFilter').value;

  const rows = document.querySelectorAll('#myTable tbody tr');

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const rowText = cells.map(cell => cell.textContent.toLowerCase()).join(' ');
    const region = cells[0].textContent;
    const holes = cells[2].textContent;

    const matchesSearch = rowText.includes(searchValue);
    const matchesRegion = !selectedRegion || region === selectedRegion;
    const matchesHoles = !selectedHoles || holes === selectedHoles;

    row.style.display = (matchesSearch && matchesRegion && matchesHoles) ? '' : 'none';
  });

  // Recalculate distances for filtered rows after search
  if (userLat && userLng) {
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
}


// =======================
// COLUMN SORTING
// =======================

// Clickable headers for sorting
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

// Determine column index from name
function getColumnIndex(column) {
  console.log("getColumnIndex()"); 
  if (column === 'distance') {
    // Return the last column index dynamically
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

// Generic table sorter
function sortTable(column) {
  console.log("sortTable()"); 
  console.log("sortTable() called with column:", column); 
  console.log("Current sort order:", currentSortOrder);
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

// =======================
// LOCATION AUTOCOMPLETE (PHOTON)
// =======================

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
        const country = feature.properties.country || '';
        const fullLabel = `${name}, ${city}, ${country}`;
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];

        const item = document.createElement('div');
        item.textContent = fullLabel;
        item.classList.add('suggestion-item');
        item.addEventListener('click', () => {
          input.value = fullLabel; // Set input value to selected location
          suggestionBox.innerHTML = '';
          sortCoursesByDistance(lat, lng); // Sort courses by proximity to selected location
        });

        suggestionBox.appendChild(item); // Add suggestion to list
      });
    } catch (err) {
      console.error('Photon autocomplete error:', err); // Handle errors
    }
  });
}

// =======================
// DISTANCE SORTING
// =======================

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

// Haversine formula to calculate distance
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

// =======================
// GEOLOCATION HANDLER
// =======================

// Detect user location when the 📍 icon is clicked
document.getElementById('detectLocation').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  // Attempt to get the user's current position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
      console.log("Location detected:", userLat, userLng);
 
      // Automatically update the location input field
      const locationInput = document.getElementById('locationInput');
      locationInput.value = 'My Location';

      // Make sure the Distance column is visible
      const distanceHeader = document.getElementById('distanceHeader');
      if (distanceHeader) {
        distanceHeader.style.display = '';
      }

      // Re-render the table with updated distances
      //filterTable();
      // Force re-render of table with distances
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const rows = data.values.slice(1);
          const groupedRows = groupByCourseName(rows);
          const mostRecentRows = getMostRecentRows(groupedRows);
          renderTable(mostRecentRows);
        });
    },
    (error) => {
      console.error('Geolocation error:', error.message);
      alert('Unable to retrieve your location.');
    }
  );
});

