let currentSortColumn = null; // Keep track of the current column being sorted
let currentSortOrder = 'asc'; // Track if the sort order is ascending or descending

// Fetch data from Google Sheets API
const sheetId = '1fMXuc1NynI3IncXzPLefj2OETDnF0NGAVKqIojP-GlY';
const apiKey = 'AIzaSyA54V9Ype7Gkw71MfEVMEYjjdkJKF0w2ac';
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const tableBody = document.querySelector('#myTable tbody');
    const headers = data.values[0];
    const rows = data.values.slice(1);

    // Group rows by courseName
    const groupedRows = groupByCourseName(rows);

    // For each courseName, keep only the most recent "Last Updated" row
    const mostRecentRows = getMostRecentRows(groupedRows);

    // Create rows in the table
    mostRecentRows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach((cell, i) => { // Use `i` to track column index
        const td = document.createElement('td');
        
        // Make the website column clickable if it contains a URL
        if (i === 4 && cell) { // Assuming "Website" is the 5th column (index 4)
          const link = document.createElement('a');
          link.href = cell;
          link.textContent = cell;
          link.target = '_blank'; // Open the link in a new tab
          td.appendChild(link);
        } else {
          td.textContent = cell;
        }
        
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    // Sorting functionality
    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.column;

        // Check if the clicked column is already being sorted, if yes, toggle the order
        if (column === currentSortColumn) {
          currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortColumn = column;
          currentSortOrder = 'asc'; // default to ascending when a new column is selected
        }

        // Sort the table
        sortTable(column);
      });
    });

    function sortTable(column) {
      const rows = Array.from(document.querySelectorAll('#myTable tbody tr'));
      const sortedRows = rows.sort((a, b) => {
        const cellA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        const cellB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

        if (currentSortOrder === 'asc') {
          return cellA.localeCompare(cellB);
        } else {
          return cellB.localeCompare(cellA);
        }
      });

      // Re-append the sorted rows to the table body
      const tableBody = document.querySelector('#myTable tbody');
      sortedRows.forEach(row => tableBody.appendChild(row));
    }

    function getColumnIndex(column) {
      switch (column) {
        case 'region': return 1;  // Adjust for actual column names in your table
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
        default: return 1; // Default to the first column
      }
    }

    // Group rows by courseName
    function groupByCourseName(rows) {
      return rows.reduce((acc, row) => {
        const courseName = row[1]; // Assuming "Course Name" is in column 1 (index 1)
        if (!acc[courseName]) {
          acc[courseName] = [];
        }
        acc[courseName].push(row);
        return acc;
      }, {});
    }

    // Get the most recent row for each courseName based on "Last Updated"
    function getMostRecentRows(groupedRows) {
      const mostRecentRows = [];
      
      for (const courseName in groupedRows) {
        const rows = groupedRows[courseName];

        // Find the row with the most recent "Last Updated"
        const mostRecentRow = rows.reduce((latestRow, currentRow) => {
          const latestDate = parseDate(latestRow[10]); // Assuming "Last Updated" is in column 10 (index 10)
          const currentDate = parseDate(currentRow[10]);
          return currentDate > latestDate ? currentRow : latestRow;
        });

        mostRecentRows.push(mostRecentRow);
      }

      return mostRecentRows;
    }

    // Parse the date in a format that JavaScript can understand
    function parseDate(dateString) {
      const date = new Date(dateString);
      return isNaN(date) ? new Date(0) : date; // If the date is invalid, return a fallback date
    }

    // Search functionality
    document.getElementById('search').addEventListener('input', function () {
      const searchValue = this.value.toLowerCase();
      const rows = document.querySelectorAll('#myTable tbody tr');
      
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const rowText = cells.map(cell => cell.textContent.toLowerCase()).join(' ');
        
        if (rowText.includes(searchValue)) {
          row.style.display = ''; // Show the row
        } else {
          row.style.display = 'none'; // Hide the row
        }
      });
    });
  })
  .catch(error => console.error('Error fetching data:', error));
