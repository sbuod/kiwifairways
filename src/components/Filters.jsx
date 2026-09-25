import React from "react";
import {
  Anchor,
  Badge,
  Button,
  Group,
  Input,
  Pill,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";
import classes from "../styles/toolbar.module.css";

const HOLES_OPTIONS = [
  { value: "", label: "All" },
  { value: "9", label: "9 holes" },
  { value: "18", label: "18 holes" },
];

const countActiveFilters = ({ search, region, holes }) =>
  (search ? 1 : 0) + (region ? 1 : 0) + (holes ? 1 : 0);

function Filters({
  search,            // current search text
  region,            // selected region
  holes,             // selected holes count ('' | '9' | '18')
  onSearch,          // setter for search text
  onRegionChange,    // setter for region
  onHolesChange,     // setter for holes
  onClear,           // clears all three filters
  courses,           // all courses to derive options from
  opened,            // whether the popover is open
  onOpenedChange,    // open/close the popover
}) {
  // Build a sorted list of unique regions from course data
  const regions = [
    ...new Set(courses.map((course) => course.region).filter(Boolean)),
  ].sort();

  const activeCount = countActiveFilters({ search, region, holes });

  return (
    <Popover
      opened={opened}
      onChange={onOpenedChange}
      position="bottom-start"
      width={300}
      shadow="md"
      radius="md"
      middlewares={{ shift: true, flip: true }}
      classNames={{ dropdown: classes.dropdown }}
    >
      <Popover.Target>
        <Button
          variant="default"
          radius="xl"
          className={classes.trigger}
          leftSection={<IconFilter size={16} color="var(--mantine-color-kfGreen-6)" />}
          rightSection={
            activeCount > 0 ? (
              <Badge circle size="sm" className={classes.countBadge}>
                {activeCount}
              </Badge>
            ) : null
          }
          onClick={() => onOpenedChange(!opened)}
          aria-expanded={opened}
        >
          Filters
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="sm" p="md">
          <TextInput
            label="Course"
            placeholder="Search by name"
            radius="xl"
            value={search}
            onChange={(e) => onSearch(e.currentTarget.value)}
            classNames={{ label: classes.fieldLabel, input: classes.input }}
          />

          <Select
            label="Region"
            data={regions}
            clearable
            placeholder="All regions"
            radius="xl"
            value={region || null}
            onChange={(val) => onRegionChange(val || "")}
            comboboxProps={{ withinPortal: false }}
            classNames={{ label: classes.fieldLabel, input: classes.input }}
          />

          <Input.Wrapper label="Holes" classNames={{ label: classes.fieldLabel }}>
            <SegmentedControl
              data={HOLES_OPTIONS}
              value={String(holes)}
              onChange={onHolesChange}
              radius="xl"
              color="kfGreen"
              fullWidth
              classNames={{ root: classes.segmentRoot, label: classes.segmentLabel }}
            />
          </Input.Wrapper>
        </Stack>

        <Group justify="space-between" className={classes.panelFooter}>
          <Button variant="subtle" color="gray" size="compact-sm" className={classes.quietAction} onClick={onClear}>
            Clear
          </Button>
          <Button
            variant="subtle"
            color="kfGreen"
            size="compact-sm"
            className={classes.primaryAction}
            onClick={() => onOpenedChange(false)}
          >
            Done
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}

// One removable pill per active filter, plus "Clear all". Renders nothing
// when no filter is active.
export function ActiveFilterPills({ search, region, holes, onSearch, onRegionChange, onHolesChange, onClear }) {
  if (countActiveFilters({ search, region, holes }) === 0) return null;

  return (
    <Group gap={8} className={classes.pills}>
      {search && (
        <Pill withRemoveButton className={classes.pill} onRemove={() => onSearch("")}>
          {`“${search}”`}
        </Pill>
      )}
      {region && (
        <Pill withRemoveButton className={classes.pill} onRemove={() => onRegionChange("")}>
          {region}
        </Pill>
      )}
      {holes && (
        <Pill withRemoveButton className={classes.pill} onRemove={() => onHolesChange("")}>
          {`${holes} holes`}
        </Pill>
      )}
      <Anchor component="button" type="button" size="xs" className={classes.clearAll} onClick={onClear}>
        Clear all
      </Anchor>
    </Group>
  );
}

export default Filters;
