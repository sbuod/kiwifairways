import React, { useState, useEffect } from "react";
import { DataTable } from 'mantine-datatable';
import { Anchor, Group, Text, Tooltip } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import classes from '../styles/coursetable.module.css';

// Ranking sources, in column order. `source` matches course_rankings.source.
export const RANKING_SOURCES = [
  { source: 'top100', accessor: 'rank_top100', name: 'Top 100 Golf Courses', url: 'https://www.top100golfcourses.com/' },
  { source: 'nzgolfrankings', accessor: 'rank_nzgolfrankings', name: 'NZ Golf Rankings', url: 'https://golfrankings.co.nz/' },
  { source: 'agd', accessor: 'rank_agd', name: 'Australian Golf Digest', url: 'https://www.australiangolfdigest.com.au/' },
];

// Column picker groups. Labels here are the full picker labels; the table
// headings use the shorter titles defined in getColumns().
export const COLUMN_GROUPS = [
  {
    id: 'fees',
    label: 'Fees',
    columns: [
      { accessor: 'affiliated_gf', label: 'Affiliated Green Fee' },
      { accessor: 'unaffiliated_gf', label: 'Unaffiliated Green Fee' },
      { accessor: 'full_membership', label: 'Full Membership' },
    ],
  },
  {
    id: 'rankings',
    label: 'Rankings',
    columns: RANKING_SOURCES.map(({ accessor, name }) => ({ accessor, label: name })),
  },
  {
    id: 'course',
    label: 'Course',
    columns: [
      { accessor: 'holes', label: 'Holes' },
      { accessor: 'par', label: 'Par' },
      { accessor: 'rating', label: 'Rating' },
      { accessor: 'slope', label: 'Slope' },
      { accessor: 'length', label: 'Length' },
    ],
  },
  {
    id: 'other',
    label: 'Other Info',
    columns: [
      { accessor: 'num_members', label: '# Members' },
      { accessor: 'region', label: 'Region' },
      { accessor: 'date', label: 'Last Updated' },
    ],
  },
];

const GROUP_OF = Object.fromEntries(
  COLUMN_GROUPS.flatMap((g) => g.columns.map((c) => [c.accessor, g.id]))
);

// Empty values in these columns always sort last, in both directions
const NULLS_LAST = RANKING_SOURCES.map((r) => r.accessor);

const Missing = ({ children }) => <span className={classes.missing}>{children}</span>;

const formatNumber = (value) => (value == null ? <Missing>TBC</Missing> : value);
const formatCurrency = (value) => (value == null ? <Missing>TBC</Missing> : `$${value}`);
const formatMembership = (value) => (value == null ? <Missing>TBC</Missing> : `$${value.toLocaleString('en-NZ')}`);
const formatLength = (value) => (value == null ? <Missing>TBC</Missing> : value.toLocaleString('en-NZ'));
const formatRank = (value) => (value == null ? <Missing>–</Missing> : value);
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
    : <Missing>TBC</Missing>;

const headerTitle = (label, tip) => (
  <Tooltip label={<Text fz="xs">{tip}</Text>} color="var(--table-header-hover)" withArrow>
    <span>{label}</span>
  </Tooltip>
);

// All column definitions, in display order. Every column is always present so
// useDataTableColumns keeps a stable order; Distance is hidden (not toggled)
// until a location is set, and Course can't be toggled at all.
export function getColumns({ showDistance }) {
  return [
    {
      accessor: 'name',
      title: headerTitle('Course', 'Course name'),
      sortable: true,
      toggleable: false,
      titleClassName: classes.courseName,
      cellsClassName: classes.courseName,
      // mantine-datatable's internal scroll/height measurement seems to key off
      // a footer row existing at all, independent of its content or styling —
      // keep an invisible one here; the real, visible text renders below the
      // table (see the footer Group below) so it isn't boxed in by the table border.
      footer: ' ',
      footerClassName: classes.footerSpacer,
      render: (record) => (
        <span className={classes.courseNameCell}>
          <span className={classes.courseNameText}>{record.name}</span>
          {record.website && (
            <a
              href={record.website}
              target="_blank"
              rel="noopener noreferrer"
              title={record.website}
              className={classes.linkIcon}
            >
              <IconExternalLink size={14} />
            </a>
          )}
        </span>
      ),
    },
    {
      accessor: 'distance_km',
      title: headerTitle('Distance', 'Distance from the entered location'),
      sortable: true,
      toggleable: false,
      hidden: !showDistance,
      textAlign: 'right',
      render: (record) =>
        record.distance_km != null ? `${record.distance_km.toFixed(1)} km` : <Missing>TBC</Missing>,
    },
    // Fees
    {
      accessor: 'affiliated_gf',
      title: headerTitle('Affiliated GF', 'Green fee for affiliated golfers'),
      sortable: true,
      toggleable: true,
      defaultToggle: true,
      textAlign: 'center',
      cellsClassName: classes.fee,
      render: (record) => formatCurrency(record.affiliated_gf),
    },
    {
      accessor: 'unaffiliated_gf',
      title: headerTitle('Unaffiliated GF', 'Green fee for unaffiliated golfers'),
      sortable: true,
      toggleable: true,
      defaultToggle: true,
      textAlign: 'center',
      cellsClassName: classes.fee,
      render: (record) => formatCurrency(record.unaffiliated_gf),
    },
    {
      accessor: 'full_membership',
      title: headerTitle('Membership', 'Full Membership Cost. Each club will have various options'),
      sortable: true,
      toggleable: true,
      defaultToggle: true,
      textAlign: 'center',
      cellsClassName: classes.fee,
      render: (record) => formatMembership(record.full_membership),
    },
    // Rankings
    ...[
      ['Top 100', 'NZ ranking by Top 100 Golf Courses'],
      ['NZ Golf', 'NZ ranking by NZ Golf Rankings'],
      ['Australian GD', 'NZ ranking by Australian Golf Digest'],
    ].map(([label, tip], i) => {
      const { accessor } = RANKING_SOURCES[i];
      return {
        accessor,
        title: headerTitle(label, tip),
        sortable: true,
        toggleable: true,
        defaultToggle: true,
        textAlign: 'center',
        render: (record) => formatRank(record[accessor]),
      };
    }),
    // Course
    {
      accessor: 'holes',
      title: headerTitle('Holes', 'Number of holes'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatNumber(record.holes),
    },
    {
      accessor: 'par',
      title: headerTitle('Par', 'Par for the hardest course rating'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatNumber(record.par),
    },
    {
      accessor: 'rating',
      title: headerTitle('Rating', 'The hardest course rating. Each course will have easier options'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatNumber(record.rating),
    },
    {
      accessor: 'slope',
      title: headerTitle('Slope', 'The hardest slope rating. Each course will have easier options'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatNumber(record.slope),
    },
    {
      accessor: 'length',
      title: headerTitle('Length', 'The longest the course can play, in metres. Each will have shorter options'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatLength(record.length),
    },
    // Other Info
    {
      accessor: 'num_members',
      title: headerTitle('# Members', 'Total number of members'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'center',
      render: (record) => formatNumber(record.num_members),
    },
    {
      accessor: 'region',
      title: headerTitle('Region', 'Per New Zealand geography, rather than NZ Golf regions'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      render: (record) => record.region || <Missing>TBC</Missing>,
    },
    {
      accessor: 'date',
      title: headerTitle('Last Updated', 'The date the information about this course was last updated'),
      sortable: true,
      toggleable: true,
      defaultToggle: false,
      textAlign: 'right',
      render: (record) => formatDate(record.date),
    },
  ];
}

// Rough px estimates used to decide whether the table needs to scroll
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 62;
const FOOTER_HEIGHT = 41;
const CHROME_ABOVE_TABLE = 260;

// Matches the tablet breakpoint the table CSS reflows at (coursetable.module.css)
const MOBILE_BREAKPOINT = 834;

// `columns` is `effectiveColumns` from useDataTableColumns (see index.js);
// `rankings` maps course_id -> { rank_top100, rank_nzgolfrankings, rank_agd }.
export default function CourseTable({ courses, rankings, columns, search, region, holes, userLocation }) {

  // Check if we have a valid location to show distance
  const showDistance = !!(userLocation && userLocation.lat && userLocation.lng);

  // Track viewport size so the table only takes a bounded, internally
  // scrolling height when its content would actually exceed the visible
  // space AND we're on a wide-enough screen. On mobile we deliberately skip
  // the bounded height: a large internal scroll area there captures touch
  // scrolling meant for the page, making the header/filters above it feel
  // "stuck" since the page itself never gets to scroll past them.
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track which column we're sorting by and in which direction
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: showDistance ? 'distance_km' : 'name',
    direction: 'asc'
  });

  // Setting a location sorts by distance; clearing it resets to name
  const [prevShowDistance, setPrevShowDistance] = useState(showDistance);
  if (showDistance !== prevShowDistance) {
    setPrevShowDistance(showDistance);
    setSortStatus({ columnAccessor: showDistance ? 'distance_km' : 'name', direction: 'asc' });
  }

  // STEP 1: FILTER THE COURSES
  // Only show courses that match the search, region, and holes filters
  const filteredCourses = courses.filter((course) => {
    const nameMatch = course.name.toLowerCase().includes(search.toLowerCase());
    const regionMatch = region ? course.region === region : true;
    const courseHoles = course.holes || course.course_layouts?.[0]?.holes;
    const holesMatch = holes ? courseHoles === Number(holes) : true;
    return nameMatch && regionMatch && holesMatch;
  });

  // STEP 2: TRANSFORM THE DATA
  // Convert the filtered courses into the format the table needs
  const records = filteredCourses.map(course => {
    // Get layout information (holes, par, rating, etc.)
    const layout = {
      holes: course.holes || course.course_layouts?.[0]?.holes,
      par: course.par || course.course_layouts?.[0]?.par,
      rating: course.rating || course.course_layouts?.[0]?.rating,
      slope: course.slope || course.course_layouts?.[0]?.slope,
      length: course.length || course.course_layouts?.[0]?.length,
    };

    // Get stats information (membership, green fees, etc.)
    const stats = {
      num_members: course.num_members || course.course_stats?.[0]?.num_members,
      full_membership: course.full_membership || course.course_stats?.[0]?.full_membership,
      unaffiliated_gf: course.unaffiliated_gf || course.course_stats?.[0]?.unaffiliated_gf,
      affiliated_gf: course.affiliated_gf || course.course_stats?.[0]?.affiliated_gf,
      date: course.date || course.course_stats?.[0]?.date,
    };

    const ranks = rankings[course.id] || {};

    // Return a flattened object with all the data we need
    return {
      id: course.id,
      name: course.name,
      region: course.region,
      website: course.website,
      holes: layout.holes,
      par: layout.par,
      rating: layout.rating,
      slope: layout.slope,
      length: layout.length,
      num_members: stats.num_members,
      full_membership: stats.full_membership,
      unaffiliated_gf: stats.unaffiliated_gf,
      affiliated_gf: stats.affiliated_gf,
      date: stats.date,
      distance_km: course.distance_km,
      ...Object.fromEntries(RANKING_SOURCES.map(({ accessor }) => [accessor, ranks[accessor] ?? null])),
    };
  });

  // STEP 3: DECORATE COLUMNS
  // Visibility is already applied as `hidden` by useDataTableColumns. Strip the
  // toggle props so DataTable doesn't enable its built-in right-click toggle
  // menu (we use ColumnPicker instead). Then the first visible column of each
  // picker group gets a left divider.
  const seenGroups = new Set();
  // eslint-disable-next-line no-unused-vars
  const tableColumns = columns.map(({ toggleable, defaultToggle, ...col }) => {
    const group = GROUP_OF[col.accessor];
    if (col.hidden || !group || seenGroups.has(group)) return col;
    seenGroups.add(group);
    return {
      ...col,
      titleClassName: [col.titleClassName, classes.groupRuleStart].filter(Boolean).join(' '),
      cellsClassName: [col.cellsClassName, classes.groupRuleStart].filter(Boolean).join(' '),
    };
  });

  // STEP 4: SORT THE RECORDS
  // Create a sorted copy of the records based on the current sort status
  const sortedRecords = [...records].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;
    let aValue = a[columnAccessor];
    let bValue = b[columnAccessor];

    // Unranked courses always go to the bottom, whichever way we sort
    if (NULLS_LAST.includes(columnAccessor)) {
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
    }

    // Handle null/undefined values by treating them as empty strings
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Convert strings to lowercase for case-insensitive sorting
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    // Compare the values and return the sort order
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Only force a bounded, scrollable height once the content would actually
  // exceed the visible viewport, and only on wide-enough screens — otherwise
  // let the table shrink to (or grow with) its content and scroll with the page.
  const estimatedContentHeight = HEADER_HEIGHT + sortedRecords.length * ROW_HEIGHT + FOOTER_HEIGHT;
  const availableHeight = viewport.height - CHROME_ABOVE_TABLE;
  const isMobile = viewport.width < MOBILE_BREAKPOINT;
  const tableHeight = !isMobile && estimatedContentHeight > availableHeight ? `${availableHeight}px` : undefined;

  // Minimum table width grows with the number of visible columns, so a few
  // columns fill the card and many columns scroll sideways
  const shownCount = tableColumns.filter((c) => !c.hidden && c.accessor !== 'name').length;
  const tableMinWidth = `min(${240 + shownCount * 96}px, max(100%, ${160 + shownCount * 84}px))`;

  // STEP 5: RENDER THE TABLE
  return (
    <div className={classes.tableWrapper} style={{ '--ct-table-min-width': tableMinWidth }}>
      <DataTable
        height={tableHeight}
        minHeight={sortedRecords.length ? undefined : 180}
        highlightOnHover
        striped
        withTableBorder
        borderRadius="md"
        backgroundColor="var(--ct-surface)"
        borderColor="var(--ct-border)"
        rowBorderColor="var(--ct-row-divider)"
        stripedColor="var(--ct-zebra)"
        highlightOnHoverColor="var(--ct-row-hover)"
        stickyHeader
        pinFirstColumn
        records={sortedRecords}
        columns={tableColumns}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        noRecordsText="No golf courses found"
        horizontalSpacing={0}
        verticalSpacing={0}
        classNames={{ header: classes.header, table: classes.table, footer: classes.footerSpacer }}
      />
      <Group justify="space-between" mt={10} px={16} gap="4px 24px" className={classes.footer}>
        <Text size="xs" c="dimmed">
          {`Showing ${records.length} of ${courses.length} courses`}
        </Text>
        <Group gap="4px 6px">
          <Text size="xs" c="dimmed">Rankings courtesy of</Text>
          {RANKING_SOURCES.map(({ source, name, url }, i) => (
            <React.Fragment key={source}>
              {i > 0 && <Text size="xs" c="dimmed" aria-hidden="true">·</Text>}
              <Anchor href={url} target="_blank" rel="noopener noreferrer" size="xs" className={classes.creditLink}>
                {name}
              </Anchor>
            </React.Fragment>
          ))}
        </Group>
      </Group>
    </div>
  );
}
