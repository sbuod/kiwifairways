import React from "react";
import { TextInput, Select, Group } from "@mantine/core"; // Mantine input for nicer UX
import LocationSearch from "./LocationSearch";

console.log("🏌️‍♂️ Filters component loaded");

function Filters({
  search,            // current search text
  region,            // selected region
  holes,             // selected holes count
  onSearch,          // setter for search text
  onRegionChange,    // setter for region
  onHolesChange,     // setter for holes
  onLocationSelect,  // callback when user sets/clears location
  courses,           // all courses to derive options from
}) {
  // Build a sorted list of unique regions from course data
  const uniqueRegions = [
    ...new Set(courses.map((course) => course.region).filter(Boolean)),
  ].sort();

  // Build a sorted list of unique hole counts from course layouts
  const uniqueHoles = [
    ...new Set(
      courses
        .map((course) => course.course_layouts?.[0]?.holes || course.holes)
        .filter((h) => h != null)
    ),
  ].sort((a, b) => a - b);

  // Mantine Select expects string values
  const holesData = uniqueHoles.map((h) => ({ value: String(h), label: `${h} Holes` }));

  // Mantine Select data for regions
  const regionData = uniqueRegions.map((r) => ({ value: r, label: r }));

  return (
    <div className="filter-bar">

      {/* Row 1: Region + Holes side by side */}
      <Group grow>
        <Select
          radius="xl"
          placeholder="Filter by region"
          data={regionData}
          value={region === "" ? null : region}
          onChange={(val) => onRegionChange(val || "")}
          clearable
          searchable
          //style={{ minWidth: 170 }}
        />

        <Select
          radius="xl"
          placeholder="Filter by # holes"
          data={holesData}
          value={holes === "" ? null : String(holes)}
          onChange={(val) => onHolesChange(val ? Number(val) : "")}
          clearable
          searchable
          //style={{ maxWidth: 160 }}
        />
      </Group>

      {/* Row 2: Search input */}
      <Group grow>
        <TextInput
          radius="xl"
          placeholder="Filter by course"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ minWidth: 300 }}
        />
      </Group>

      {/* Row 3: Location search */}
      <Group grow>
        <div className="location-section">
          <LocationSearch onLocationSelect={onLocationSelect} />
        </div>
      </Group>
    </div>
  );
}

export default Filters;