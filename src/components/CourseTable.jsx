import React, { useState, useEffect } from "react";
import { DataTable } from 'mantine-datatable';
import { Tooltip, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import classes from '../styles/coursetable.module.css';

const formatNumber = (value) => (value == null ? 'TBC' : value);
const formatCurrency = (value) => (value == null ? 'TBC' : `$${value}`);
const formatMembership = (value) => (value == null ? 'TBC' : `$${value.toLocaleString('en-NZ')}`);
const formatLength = (value) => (value == null ? 'TBC' : value.toLocaleString('en-NZ'));
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBC';

// Rough px estimates used to decide whether the table needs to scroll
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 62;
const FOOTER_HEIGHT = 41;
const CHROME_ABOVE_TABLE = 220;

// Matches the tablet breakpoint the filter bar already reflows at (styles.css)
const MOBILE_BREAKPOINT = 834;

export default function CourseTable({courses, search, region, holes, userLocation}) {

  // Check if we have a valid location to show distance
  const showDistance = userLocation && userLocation.lat && userLocation.lng;

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

  // Update sort to distance when location becomes available
  useEffect(() => {
    if (showDistance && sortStatus.columnAccessor === 'name') {
      setSortStatus({ columnAccessor: 'distance_km', direction: 'asc' });
    }
  }, [showDistance]);

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
      distance_km: course.distance_km
    };
  });

  const footerText = `Showing ${records.length} of ${courses.length} courses`;

  // STEP 3: DEFINE COLUMNS
  const columns = [
    {
      accessor: 'name',
      title: (
        <Tooltip label={<Text fz="xs">Course name</Text>} color="var(--table-header-hover)" withArrow>
          <span>Course</span>
        </Tooltip>
      ),
      sortable: true,
      width: '16%',
      cellsClassName: classes.courseName,
      footer: footerText,
      footerClassName: classes.footerCell,
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
      accessor: 'unaffiliated_gf',
      title: (
        <Tooltip label={<Text fz="xs">Green Fee (Unaffiliated)</Text>} color="var(--table-header-hover)" withArrow>
          <span>Green fee</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '7%',
      titleClassName: classes.groupRuleStart,
      cellsClassName: `${classes.groupRuleStart} ${classes.feeHero}`,
      render: (record) => formatCurrency(record.unaffiliated_gf),
    },
    {
      accessor: 'affiliated_gf',
      title: (
        <Tooltip label={<Text fz="xs">Green Fee (Affiliated)</Text>} color="var(--table-header-hover)" withArrow>
          <span>Affiliated</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '7.5%',
      cellsClassName: classes.feeHero,
      render: (record) => formatCurrency(record.affiliated_gf),
    },
    {
      accessor: 'num_members',
      title: (
        <Tooltip label={<Text fz="xs">Total number of members</Text>} color="var(--table-header-hover)" withArrow>
          <span>Members</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '7%',
      titleClassName: `${classes.groupRuleStart} ${classes.textSecondary}`,
      cellsClassName: `${classes.groupRuleStart} ${classes.textSecondary}`,
      render: (record) => formatNumber(record.num_members),
    },
    {
      accessor: 'full_membership',
      title: (
        <Tooltip label={<Text fz="xs">Full Membership Cost. Each club will have various options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Full Membership</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '10%',
      cellsClassName: classes.textSecondary,
      render: (record) => formatMembership(record.full_membership),
    },
    {
      accessor: 'holes',
      title: (
        <Tooltip label={<Text fz="xs">Number of holes</Text>} color="var(--table-header-hover)" withArrow>
          <span>Holes</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '5.5%',
      titleClassName: classes.groupRuleStart,
      cellsClassName: classes.groupRuleStart,
      render: (record) => formatNumber(record.holes),
    },
    {
      accessor: 'par',
      title: (
        <Tooltip label={<Text fz="xs">Par for the hardest course rating</Text>} color="var(--table-header-hover)" withArrow>
          <span>Par</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '5%',
      render: (record) => formatNumber(record.par),
    },
    {
      accessor: 'rating',
      title: (
        <Tooltip label={<Text fz="xs">The hardest course rating. Each course will have easier options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Rating</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '6.5%',
      render: (record) => formatNumber(record.rating),
    },
    {
      accessor: 'slope',
      title: (
        <Tooltip label={<Text fz="xs">The hardest slope rating. Each course will have easier options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Slope</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '6%',
      render: (record) => formatNumber(record.slope),
    },
    {
      accessor: 'length',
      title: (
        <Tooltip label={<Text fz="xs">The longest the course can play, in metres. Each will have shorter options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Length</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '7.5%',
      render: (record) => formatLength(record.length),
    },
    {
      accessor: 'region',
      title: (
        <Tooltip label={<Text fz="xs">Per New Zealand geography, rather than NZ Golf regions</Text>} color="var(--table-header-hover)" withArrow>
          <span>Region</span>
        </Tooltip>
      ),
      sortable: true,
      width: '13%',
      cellsClassName: classes.textSecondary,
    },
    {
      accessor: 'date',
      title: (
        <Tooltip label={<Text fz="xs">The date the information about this course was last updated</Text>} color="var(--table-header-hover)" withArrow>
          <span>Updated</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '9%',
      titleClassName: classes.groupRuleStart,
      cellsClassName: `${classes.groupRuleStart} ${classes.textMuted}`,
      render: (record) => formatDate(record.date),
    },
  ];

  // Add the distance column right after Course if we have location data
  if (showDistance) {
    columns.splice(1, 0, {
      accessor: 'distance_km',
      title: (
        <Tooltip label={<Text fz="xs">Distance from the entered location</Text>} color="var(--table-header-hover)" withArrow>
          <span>Distance</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: '8%',
      cellsClassName: classes.textMuted,
      render: (record) => record.distance_km ? `${record.distance_km.toFixed(1)} km` : 'TBC',
    });
  }

  // STEP 4: SORT THE RECORDS
  // Create a sorted copy of the records based on the current sort status
  const sortedRecords = [...records].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;
    let aValue = a[columnAccessor];
    let bValue = b[columnAccessor];

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

  // STEP 8: RENDER THE TABLE
  return (
    <div className={classes.tableWrapper}>
      <DataTable
        height={tableHeight}
        highlightOnHover
        striped
        withTableBorder
        borderRadius={12}
        backgroundColor="var(--ct-surface)"
        borderColor="var(--ct-border)"
        rowBorderColor="var(--ct-row-divider)"
        stripedColor="var(--ct-zebra)"
        highlightOnHoverColor="var(--ct-row-hover)"
        stickyHeader
        pinFirstColumn
        records={sortedRecords}
        columns={columns}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        noRecordsText="No golf courses found"
        horizontalSpacing={0}
        verticalSpacing={0}
        fontSize={13}
        className={showDistance ? "show-distance" : ""}
        classNames={{ header: classes.header, table: classes.table, footer: classes.footer }}
      />
    </div>
  );
}
