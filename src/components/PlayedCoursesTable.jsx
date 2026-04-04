import React, { useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Text, ActionIcon, Group } from '@mantine/core';

export const PlayedCoursesTable = ({ playedCourses, onEdit, onDelete }) => {
  // Track which column we're sorting by and in which direction
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'course_info.name',
    direction: 'asc'
  });

  // Transform the data for the table
  const records = playedCourses.map(played => ({
    id: played.id,
    region: played.course_info?.region || '-',
    courseName: played.course_info?.name || '-',
    favoriteHole: played.favorite_hole,
    holeDescription: played.hole_description,
    website: played.course_info?.website
  }));

  // Sort the records based on current sort status
  const sortedRecords = [...records].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;
    let aVal = a[columnAccessor];
    let bVal = b[columnAccessor];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined || aVal === '-') return 1;
    if (bVal === null || bVal === undefined || bVal === '-') return -1;

    // Numeric comparison for favorite hole
    if (columnAccessor === 'favoriteHole') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // String comparison for everything else
    const comparison = String(aVal).localeCompare(String(bVal));
    return direction === 'asc' ? comparison : -comparison;
  });

  // Define table columns
  const columns = [
    {
      accessor: 'region',
      title: 'Region',
      sortable: true,
      width: 150,
    },
    {
      accessor: 'courseName',
      title: 'Course Name',
      sortable: true,
      width: 250,
      render: (record) => (
        record.website ? (
          <a
            href={record.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#5B6E2C', textDecoration: 'none' }}
          >
            {record.courseName}
          </a>
        ) : (
          <Text>{record.courseName}</Text>
        )
      )
    },
    {
      accessor: 'favoriteHole',
      title: 'Favorite Hole',
      sortable: true,
      textAlign: 'center',
      width: 120,
    },
    {
      accessor: 'holeDescription',
      title: 'Why It\'s My Favorite',
      sortable: true,
      width: 400,
      render: (record) => (
        <Text style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {record.holeDescription}
        </Text>
      ),
    },
    {
      accessor: 'actions',
      title: 'Actions',
      textAlign: 'center',
      width: 100,
      render: (record) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
          <ActionIcon
            variant="subtle"
            onClick={() => onEdit && onEdit(record.id)}
            title="Edit"
            style={{ color: 'var(--header-green)' }}
          >
            ✏️
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            onClick={() => onDelete && onDelete(record.id)}
            title="Delete"
            style={{ color: 'var(--header-green)' }}
          >
            🗑️
          </ActionIcon>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      records={sortedRecords}
      columns={columns}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      striped
      highlightOnHover
      verticalSpacing="sm"
      horizontalSpacing="md"
      minHeight={playedCourses.length === 0 ? 150 : undefined}
      noRecordsText="You haven't added any courses yet"
      styles={{
        header: {
          backgroundColor: 'var(--header-green)',
          color: 'white',
        },
        pagination: {
          marginTop: '1rem',
        },
      }}
    />
  );
};
