import React, { useState, useEffect } from "react";
import { DataTable } from 'mantine-datatable';
import { Tooltip, Text } from '@mantine/core';
import classes from '../styles/coursetable.module.css';

export default function CourseTable({courses, search, region, holes, userLocation}) {

  // Check if we have a valid location to show distance
  const showDistance = userLocation && userLocation.lat && userLocation.lng;

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
      width: 200,
    },
    {
      accessor: 'region',
      title: (
        <Tooltip label={<Text fz="xs">Per New Zealand geography, rather than NZ Golf regions</Text>} color="var(--table-header-hover)" withArrow>
          <span>Region</span>
        </Tooltip>
      ),
      sortable: true,
      width: 120,
    },
    {
      accessor: 'holes',
      title: (
        <Tooltip label={<Text fz="xs">Number of holes</Text>} color="var(--table-header-hover)" withArrow>
          <span>Holes</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.holes || '-',
    },
    {
      accessor: 'par',
      title: (
        <Tooltip label={<Text fz="xs">Par for the hardest course rating</Text>} color="var(--table-header-hover)" withArrow>
          <span>Par</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 60,
      render: (record) => record.par || '-',
    },
    {
      accessor: 'rating',
      title: (
        <Tooltip label={<Text fz="xs">The hardest course rating. Each course will have easier options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Rating</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.rating || '-',
    },
    {
      accessor: 'slope',
      title: (
        <Tooltip label={<Text fz="xs">The hardest slope rating. Each course will have easier options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Slope</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.slope || '-',
    },
    {
      accessor: 'length',
      title: (
        <Tooltip label={<Text fz="xs">The longest the course can play, in metres. Each will have shorter options</Text>} color="var(--table-header-hover)" withArrow>
          <span>Length</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.length || '-',
    },
    {
      accessor: 'num_members',
      title: (
        <Tooltip label={<Text fz="xs">Total number of members</Text>} color="var(--table-header-hover)" withArrow>
          <span>Members</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 100,
      render: (record) => record.num_members || '-',
    },
    {
      accessor: 'full_membership',
      title: (
        <Tooltip label={<Text fz="xs">Full Membership Cost. Each club will have various options</Text>} color="var(--table-header-hover)" withArrow>
          <span>M'ship</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.full_membership ? `$${record.full_membership}` : '-',
    },
    {
      accessor: 'unaffiliated_gf',
      title: (
        <Tooltip label={<Text fz="xs">Green Fee (Unaffiliated)</Text>} color="var(--table-header-hover)" withArrow>
          <span>GF</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.unaffiliated_gf ? `$${record.unaffiliated_gf}` : '-',
    },
    {
      accessor: 'affiliated_gf',
      title: (
        <Tooltip label={<Text fz="xs">Green Fee (Affiliated)</Text>} color="var(--table-header-hover)" withArrow>
          <span>GF (A)</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 80,
      render: (record) => record.affiliated_gf ? `$${record.affiliated_gf}` : '-',
    },
    {
      accessor: 'website',
      title: 'Link',
      render: (record) => record.website ? (
        <a href={record.website} target="_blank" rel="noopener noreferrer" title={record.website} style={{ textDecoration: 'none' }}>
          🔗
        </a>
      ) : null,
      textAlign: 'center',
      width: 65,
    },
    {
      accessor: 'date',
      title: (
        <Tooltip label={<Text fz="xs">The date the information about this course was last updated</Text>} color="var(--table-header-hover)" withArrow>
          <span>Updated</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'center',
      width: 100,
      render: (record) => record.date ? new Date(record.date).toLocaleDateString('en-NZ') : '-',
    },
  ];

  // Add the distance column if we have location data
  if (showDistance) {
    columns.push({
      accessor: 'distance_km',
      title: (
        <Tooltip label={<Text fz="xs">Distance from the entered location</Text>} color="var(--table-header-hover)" withArrow>
          <span>Distance</span>
        </Tooltip>
      ),
      sortable: true,
      textAlign: 'right',
      width: 100,
      render: (record) => record.distance_km ? `${record.distance_km.toFixed(1)} km` : '-',
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

  // STEP 8: RENDER THE TABLE WITH COURSE COUNT
  return (
    <div>
      <DataTable
        height="calc(100vh)"
        highlightOnHover
        striped
        withTableBorder
        stickyHeader
        pinFirstColumn
        records={sortedRecords}
        columns={columns}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        noRecordsText="No golf courses found"
        horizontalSpacing="md"
        verticalSpacing="sm"
        fontSize="sm"
        className={showDistance ? "show-distance" : ""}
        classNames={{ header: classes.header }}
      />

      {/* Course count display */}
      <div style={{ 
        marginTop: '10px', 
        fontSize: '14px', 
        color: '#666',
        textAlign: 'left',
      }}>
        {records.length} {records.length === 1 ? 'course' : 'courses'} displayed
      </div>
    </div>
  );
}