let currentSortColumn = null;
let currentSortOrder = 'asc';

const sheetId = '1fMXuc1NynI3IncXzPLefj2OETDnF0NGAVKqIojP-GlY';
const apiKey = 'AIzaSyA54V9Ype7Gkw71MfEVMEYjjdkJKF0w2ac';
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const tableBody = document.querySelector('#myTable tbody');
    const headers = data.values[0];
    const rows = data.values.slice(1);

    const groupedRows = groupByCourseName(rows);
    const mostRecentRows = getMostRecentRows(groupedRows);

    const uniqueRegions = new Set();
    const uniqueHoles = new Set();

    mostRecentRows.forEach(row => {
      const tr = document.createElement('tr');

      // Capture Region and Holes for filters
      uniqueRegions.add(row[0]);  // Region = column index 0
      uniqueHoles.add(row[2]);    // Holes = column index 2

      row.forEach((cell, i) => {
        const td = document.createElement('td');

        if (i === 4 && cell) {
          const link = document.createElement('a');
          link.href = cell;
          link.textContent = cell;
          link.target = '_blank';
          td.appendChild(link);
        } else {
          td.textContent = cell;
        }

        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });

    populateFilter('regionFilter', uniqueRegions);
    populateFilter('holesFilter', uniqueHoles);

    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.column;
        if (column === currentSortColumn) {
          currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortColumn = column;
          currentSortOrder = 'asc';
        }
        sortTable(column);
      });
    });

    function sortTable(column) {
      const rows = Array.from(document.querySelectorAll('#myTable tbody tr'));
      const sortedRows = rows.sort((a, b) => {
        const cellA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        const cellB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

        return currentSortOrder === 'asc'
          ? cellA.localeCompare(cellB)
          : cellB.localeCompare(cellA);
      });

      const tableBody = document.querySelector('#myTable tbody');
      sortedRows.forEach(row => tableBody.appendChild(row));
    }

    function getColumnIndex(column) {
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
        default: return 1;
      }
    }

    function groupByCourseName(rows) {
      return rows.reduce((acc, row) => {
        const courseName = row[1];
        if (!acc[courseName]) acc[courseName] = [];
        acc[courseName].push(row);
        return acc;
      }, {});
    }

    function getMostRecentRows(groupedRows) {
      const mostRecentRows = [];

      for (const courseName in groupedRows) {
        const rows = groupedRows[courseName];
        const mostRecentRow = rows.reduce((latestRow, currentRow) => {
          const latestDate = parseDate(latestRow[10]);
          const currentDate = parseDate(currentRow[10]);
          return currentDate > latestDate ? currentRow : latestRow;
        });

        mostRecentRows.push(mostRecentRow);
      }

      return mostRecentRows;
    }

    function parseDate(dateString) {
      const date = new Date(dateString);
      return isNaN(date) ? new Date(0) : date;
    }

    // Dynamically populate select dropdowns
    function populateFilter(selectId, values) {
      const select = document.getElementById(selectId);
      [...values].sort().forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('regionFilter').addEventListener('change', filterTable);
    document.getElementById('holesFilter').addEventListener('change', filterTable);

    function filterTable() {
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
    }
  })
  .catch(error => console.error('Error fetching data:', error));
