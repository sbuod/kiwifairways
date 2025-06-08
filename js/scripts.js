// CONFIGURATION
const supabase_url = 'https://ytafvcupzoyxqucfleiw.supabase.co'; 
const supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YWZ2Y3Vwem95eHF1Y2ZsZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxODUwMTYsImV4cCI6MjA2MTc2MTAxNn0.gc4VM3ypn7WNOgpDOpEkYsmSFEGh9PB1XSEv5SjC0jc';
const supabase_connection = supabase.createClient(supabase_url, supabase_anon_key);

const inputLocation = document.getElementById('locationInput');
const detectLocation = document.getElementById('detectLocation');
const locationIcon = document.getElementById('locationIcon');
let courseData = []; // Store course data globally

let currentSortColumn = null;
let currentSortOrder = 'asc';
let userLat = null;
let userLng = null;

// DOM INITIALISATION
document.addEventListener('DOMContentLoaded', async () => {  
  console.log("🏌️‍♂️ On the tee - kiwifairways.co.nz");
  
  courseData = await fetchCourseData(null, null); // Pass nulls for no user location
  renderCourseData(courseData);
  populateFilters(courseData);

  currentSortColumn = 'name';
  currentSortOrder = 'asc';
  sortTable('name');

  addEventListeners();

  if (locationIcon) {
    locationIcon.addEventListener('click', handleLocationIcon);
  }
});

// FETCH COURSE DATA FROM SUPABASE (JOIN ALL THREE TABLES)
async function fetchCourseData() {
  try {
    // Fetch all courses, with all layouts and stats in one go
    const { data: courses, error } = await supabase_connection
      .from('course_info')
      .select(`
        *,
        course_layouts:course_layouts!tees_course_id_fkey(*),
        course_stats:course_stats!course_stats_course_id_fkey(*)
      `);

    if (error) {
      console.error('🚑 Error fetching course info:', error);
      return [];
    }

    // For each course, pick the most recent stats and the first layout
    const enrichedCourses = courses.map(course => {
      // Pick the first layout (or add logic to pick a preferred one)
      const layoutArr = course.course_layouts || [];
      const layout = layoutArr[0] || {};

      // Pick the most recent stats by date
      const statsArr = course.course_stats || [];
      let latestStats = {};
      if (statsArr.length > 0) {
        latestStats = statsArr.reduce((latest, stat) => {
          if (!latest.date) return stat;
          return new Date(stat.date) > new Date(latest.date) ? stat : latest;
        }, statsArr[0]);
      }

      return {
        // Basic course info
        id: course.id,
        name: course.name,
        region: course.region,
        website: course.website,
        facebook: course.facebook,
        instagram: course.instagram,
        email: course.email,
        location: course.location,

        // Layout info
        holes: layout.holes || '',
        par: layout.par || '',
        rating: layout.rating || '',
        slope: layout.slope || '',
        length: layout.length || '',
        layout_name: layout.name || '',

        // Stats info
        affiliated_gf: latestStats.affiliated_gf || '',
        unaffiliated_gf: latestStats.unaffiliated_gf || '',
        full_membership: latestStats.full_membership || '',
        num_members: latestStats.num_members || '',
        notes: latestStats.notes || '',
        date: latestStats.date || '',

        // Extract GPS coordinates from PostGIS geography type
        gps: course.location ? extractGpsFromLocation(course.location) : ''
      };
    });

    console.log('⛳ Successfully fetched all course data in one query');
    return enrichedCourses;

  } catch (error) {
    console.error(`🚑 Error fetching course data: ${error}`);
    return [];
  }
}

// EXTRACT GPS COORDINATES FROM POSTGIS GEOGRAPHY TYPE
function extractGpsFromLocation(location) {
  if (!location) return '';

  try {
    // If it's a string, check if it's JSON or comma-separated
    if (typeof location === 'string') {
      const trimmed = location.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // It's GeoJSON
        const geoData = JSON.parse(trimmed);
        if (geoData && geoData.coordinates && Array.isArray(geoData.coordinates)) {
          const [lng, lat] = geoData.coordinates;
          return `${lat},${lng}`;
        }
      } else if (trimmed.includes(',')) {
        // It's a comma-separated string
        const [lng, lat] = trimmed.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          return `${lat},${lng}`;
        }
      }
    } else if (location && location.coordinates && Array.isArray(location.coordinates)) {
      // Already an object
      const [lng, lat] = location.coordinates;
      return `${lat},${lng}`;
    }
  } catch (e) {
    console.error('🚑 Error parsing location data:', e, location);
  }

  return '';
}

// RENDER COURSE DATA
function renderCourseData(courses) {
  const tableBody = document.querySelector('#myTable tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = ''; // Clear existing rows

  let totalRowsCount = courses.length;
  let visibleRowsCount = 0;
  
  // Render each course
  courses.forEach(course => {
    const tr = document.createElement('tr');

    // Create cells for each column in the expected order
    // [region, name, holes, rating, slope, length, par, affiliated_gf, unaffiliated_gf, full_membership, num_members, notes, website, date, gps]
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    };

    // Helper to format as currency
    function formatCurrency(value) {
      if (value === '' || value === null || value === undefined) return '';
      const num = Number(value);
      if (isNaN(num) || num === 0) return '';
      return `$${num}`;
    }

    const cells = [
      course.region || '',
      course.name || '',
      course.holes || '',
      course.rating || '',
      course.slope || '',
      course.length || '',
      course.par || '',
      formatCurrency(course.affiliated_gf),      // Add $ sign
      formatCurrency(course.unaffiliated_gf),    // Add $ sign
      formatCurrency(course.full_membership),    // Add $ sign
      course.num_members || '',
      course.notes || '',
      course.website || '',
      formatDate(course.date) // <-- formatted date
    ];

    // Add normal cells from the data
    cells.forEach((cellValue, i) => {
      const td = document.createElement('td');

      // Make website column clickable (index 12)
      if (i === 12 && cellValue) {
        const link = document.createElement('a');
        link.href = cellValue.startsWith('http') ? cellValue : `https://${cellValue}`;
        link.target = '_blank';
        link.innerHTML = '⛳';
        td.appendChild(link);
      } else {
        td.textContent = cellValue;
      }

      tr.appendChild(td);
    });

    // Add the distance column data if user's location is available
    if (userLat && userLng) {
      const gpsData = course.gps;
      const distanceCell = document.createElement('td');
      distanceCell.classList.add('distance-cell');

      if (typeof course.distance_km === 'number') {
        distanceCell.textContent = `${course.distance_km.toFixed(2)} km`;
        distanceCell.dataset.value = course.distance_km;
      } else {
        distanceCell.textContent = 'N/A';
      }
      tr.appendChild(distanceCell);
    }

    tableBody.appendChild(tr);
    visibleRowsCount++;
  });
  
  console.log(`⛳ Rendered course data with userLat: ${userLat}, userLng: ${userLng})`);
  // Re-apply filtering after rendering
  filterTable();  
}

// POPULATE HOLES AND REGIONS FILTERS
function populateFilters(courses) {
  const uniqueRegions = new Set();
  const uniqueHoles = new Set();

  courses.forEach(course => {
    if (course.region) uniqueRegions.add(course.region);
    if (course.holes) uniqueHoles.add(course.holes.toString());
  });

  populateFilter('regionFilter', uniqueRegions);
  populateFilter('holesFilter', uniqueHoles);
  console.log('⛳ Region and # holes filters populated'); 
}

function populateFilter(selectId, values) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // Clear existing options except the first one (usually "All")
  const firstOption = select.firstElementChild;
  select.innerHTML = '';
  if (firstOption) {
    select.appendChild(firstOption);
  }
  
  [...values].sort().forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

// FILTER THE TABLE WHEN REQUESTED
function filterTable() {
  const searchInput = document.getElementById('searchInput');
  const regionFilter = document.getElementById('regionFilter');
  const holesFilter = document.getElementById('holesFilter');
  
  if (!searchInput || !regionFilter || !holesFilter) return;
  
  const searchValue = searchInput.value.toLowerCase();
  const selectedRegion = regionFilter.value;
  const selectedHoles = holesFilter.value;

  const rows = document.querySelectorAll('#myTable tbody tr');
  let visibleRowsCount = 0;
  const totalRowsCount = rows.length;
  
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));

    // Only include visible cells in the search text
    // This ensures that on mobile, hidden columns are not searched
    const rowText = cells
      .filter(cell => getComputedStyle(cell).display !== 'none') // Only visible cells
      .map(cell => cell.textContent.toLowerCase()) // Get text content
      .join(' '); // Combine into a single string

    // Region and holes columns are always present, so we can use their index
    const region = cells[0]?.textContent || '';
    const holes = cells[2]?.textContent || '';

    // Check if the visible row text matches the search input
    const matchesSearch = rowText.includes(searchValue);
    // Check if the row matches the selected region and holes filters
    const matchesRegion = !selectedRegion || region === selectedRegion;
    const matchesHoles = !selectedHoles || holes === selectedHoles;

    // Only show the row if it matches all criteria
    const shouldShow = matchesSearch && matchesRegion && matchesHoles;
    row.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visibleRowsCount++;
  });

  // Update the visible row count display if present
  const rowCountDisplay = document.getElementById('rowCount');
  if (rowCountDisplay) {
    rowCountDisplay.innerText = `Showing ${visibleRowsCount} of ${totalRowsCount} courses`;
  }
  console.log(`⛳ Checked filters and filtered data accordingly`);
}

// MAKE TABLE HEADERS CLICKABLE & TABLE SORTABLE
function addEventListeners() {
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

  // Hook up filters and search
  const searchInput = document.getElementById('searchInput');
  const regionFilter = document.getElementById('regionFilter');
  const holesFilter = document.getElementById('holesFilter');
  
  if (searchInput) searchInput.addEventListener('input', filterTable);
  if (regionFilter) regionFilter.addEventListener('change', filterTable);
  if (holesFilter) holesFilter.addEventListener('change', filterTable);

  console.log('⛳ Added event listeners to table headers and inputs'); 
  // Autocomplete input
  setupLocationAutocomplete();
}

// DETERMINE COLUMN INDEX
function getColumnIndex(column) {
  if (column === 'distance_km') {
    const headerCount = document.querySelectorAll('#myTable thead th').length;
    console.log(`⛳ GetColumnIndex('${column}') returned:`, headerCount);
    return headerCount;
  }

  let index;
  switch (column) {
    case 'region': index = 1; break;
    case 'name': index = 2; break;
    case 'holes': index = 3; break;
    case 'rating': index = 4; break;
    case 'slope': index = 5; break;
    case 'length': index = 6; break;
    case 'par': index = 7; break;
    case 'affiliated_gf': index = 8; break;
    case 'unaffiliated_gf': index = 9; break;
    case 'full_membership': index = 10; break;
    case 'num_members': index = 11; break;
    case 'notes': index = 12; break;
    case 'website': index = 13; break;
    case 'date': index = 14; break;
    default: index = 1;
  }
  console.log(`⛳ GetColumnIndex('${column}') returned:`, index);
  return index;
}

// SORT THE TABLE BASED ON USER INTERACTION 
function sortTable(column) {
  const tableBody = document.querySelector('#myTable tbody');
  if (!tableBody) return;

  const rows = Array.from(tableBody.querySelectorAll('tr'));
  let colIndex = null;

  // For distance, always use the last column
  if (column !== 'distance_km') {
    colIndex = getColumnIndex(column) - 1;
  }

  const sortedRows = rows.sort((a, b) => {
    const cellsA = a.querySelectorAll('td');
    const cellsB = b.querySelectorAll('td');

    // Distance column: always last cell
    if (column === 'distance_km') {
      const distanceA = parseFloat(cellsA[cellsA.length - 1].textContent.replace('km', '').trim()) || 0;
      const distanceB = parseFloat(cellsB[cellsB.length - 1].textContent.replace('km', '').trim()) || 0;
      return currentSortOrder === 'asc' ? distanceA - distanceB : distanceB - distanceA;
    }

    const cellA = cellsA[colIndex]?.textContent.trim() || '';
    const cellB = cellsB[colIndex]?.textContent.trim() || '';

    // Date column
    if (column === 'date') {
      // Parse dd-mm-yyyy to Date object
      const parseDMY = (str) => {
        if (!str) return new Date(0); // Treat empty as oldest
        const [day, month, year] = str.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      const dateA = parseDMY(cellA);
      const dateB = parseDMY(cellB);
      return currentSortOrder === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    }

    // Numeric columns
    if (['holes', 'slope', 'affiliated_gf', 'unaffiliated_gf', 'full_membership', 'num_members', 'rating', 'length', 'par'].includes(column)) {
      const numA = parseFloat(cellA.replace(/[^0-9.]/g, '')) || 0;
      const numB = parseFloat(cellB.replace(/[^0-9.]/g, '')) || 0;
      return currentSortOrder === 'asc' ? numA - numB : numB - numA;
    }

    // String columns (case-insensitive)
    return currentSortOrder === 'asc'
      ? cellA.localeCompare(cellB, undefined, { sensitivity: 'base' })
      : cellB.localeCompare(cellA, undefined, { sensitivity: 'base' });
  });

  // Clear sorting indicators
  document.querySelectorAll('#myTable th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
  });

  // Add sorting indicator to current column
  const currentHeader = document.querySelector(`#myTable th[data-column="${column}"]`);
  if (currentHeader) {
    currentHeader.classList.add(`sorted-${currentSortOrder}`);
  }

  // Reorder the table
  const fragment = document.createDocumentFragment();
  sortedRows.forEach(row => fragment.appendChild(row));
  tableBody.innerHTML = '';
  tableBody.appendChild(fragment);

  console.log(`⛳ Sorted table ${currentSortOrder} by '${column}' column`);
}

// LOCATION AUTOCOMPLETE (PHOTON)
function setupLocationAutocomplete() {
  console.log("setupLocationAutocomplete()");
  const input = document.getElementById('locationInput');
  const suggestionBox = document.getElementById('locationSuggestions');

  if (!input || !suggestionBox) return;

  // Hide suggestion box initially
  suggestionBox.style.display = 'none';

  input.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    // Hide box if not enough chars
    if (query.length < 4) {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
      return;
    }

    // Show box when enough chars
    suggestionBox.style.display = 'block';

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=166.5,-47.5,179.5,-34.0`);
      const data = await res.json();

      suggestionBox.innerHTML = '';

      data.features.forEach(feature => {
        const name = feature.properties.name;
        const city = feature.properties.city || '';
        let fullLabel = (city && city !== name) ? `${name}, ${city}` : name;
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];

        const item = document.createElement('div');
        item.textContent = fullLabel;
        item.classList.add('suggestion-item');
        item.addEventListener('click', async () => {
          input.value = fullLabel;
          suggestionBox.innerHTML = '';
          suggestionBox.style.display = 'none';

          userLat = lat;
          userLng = lng;

          if (locationIcon) {
            locationIcon.innerHTML = '&#x274C;';
          }

          // Fetch courses with distance from Supabase
          courseData = await fetchCourseData(userLat, userLng);

          renderCourseData(courseData);

          const table = document.querySelector('#myTable');
          if (table) {
            table.classList.add('show-distance');
          }

          currentSortColumn = 'distance_km';
          currentSortOrder = 'asc';
          sortTable('distance_km');
        });

        suggestionBox.appendChild(item);
      });

      // If no suggestions, hide the box
      if (suggestionBox.innerHTML.trim() === '') {
        suggestionBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Photon autocomplete error:', err);
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
    }
  });

  // Optional: Hide suggestions if input loses focus (but not if clicking a suggestion)
  input.addEventListener('blur', () => {
    setTimeout(() => {
      suggestionBox.style.display = 'none';
    }, 200);
  });
}

// HANDLE LOCATION ICON INTERACTION
function handleLocationIcon() {
  console.log("handleLocationIcon()"); 
  const locationIcon = document.getElementById('locationIcon');
  const locationInput = document.getElementById('locationInput');
  
  if (!locationIcon || !locationInput) return;
  
  if (locationIcon.innerHTML === '📍') {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          userLat = position.coords.latitude;
          userLng = position.coords.longitude;
          console.log(`User location detected successfully: ${userLat},${userLng}`);

          locationInput.value = 'My Location';
          locationIcon.innerHTML = '&#x274C;';

          // Fetch courses with distance from Supabase
          courseData = await fetchCourseData(userLat, userLng);

          renderCourseData(courseData);

          const table = document.querySelector('#myTable');
          if (table) {
            table.classList.add('show-distance');
          }

          currentSortColumn = 'distance_km';
          currentSortOrder = 'asc';
          sortTable('distance_km');
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          alert('Unable to retrieve your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  } else {
    userLat = null;
    userLng = null;
    locationInput.value = '';
    locationIcon.innerHTML = '📍';

    const table = document.querySelector('#myTable');
    if (table) {
      table.classList.remove('show-distance');
    }

    renderCourseData(courseData);
  }
}

async function fetchCourseData(userLat, userLng) {
  const { data, error } = await supabase_connection
    .rpc('courses_with_distance', { user_lat: userLat, user_lng: userLng });

  if (error) {
    console.error('🚑 Error fetching course data:', error);
    return [];
  }
  return data;
}


