import React, { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Group,
  Popover,
  ScrollArea,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconColumns } from "@tabler/icons-react";
import classes from "../styles/toolbar.module.css";

// Grouped column visibility picker. State comes from mantine-datatable's
// useDataTableColumns (columnsToggle / setColumnsToggle / resetColumnsToggle);
// `groups` is [{ id, label, columns: [{ accessor, label }] }].
export default function ColumnPicker({
  groups,
  columnsToggle,
  setColumnsToggle,
  resetColumnsToggle,
  opened,
  onOpenedChange,
}) {
  const [expanded, setExpanded] = useState({});

  const isVisible = (accessor) =>
    columnsToggle.find((c) => c.accessor === accessor)?.toggled ?? false;

  const setVisible = (accessors, toggled) =>
    setColumnsToggle((prev) =>
      prev.map((c) => (accessors.includes(c.accessor) ? { ...c, toggled } : c))
    );

  const pickable = groups.flatMap((g) => g.columns.map((c) => c.accessor));
  const visibleCount = pickable.filter(isVisible).length;

  return (
    <Popover
      opened={opened}
      onChange={onOpenedChange}
      position="bottom-start"
      width={260}
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
          leftSection={<IconColumns size={16} color="var(--mantine-color-kfGreen-6)" />}
          rightSection={
            <Badge circle size="sm" className={classes.countBadge}>
              {visibleCount}
            </Badge>
          }
          onClick={() => onOpenedChange(!opened)}
          aria-expanded={opened}
        >
          Columns
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Text size="xs" fw={500} c="dimmed" className={classes.pickerHeading}>
          Show columns
        </Text>

        <ScrollArea.Autosize mah="min(60vh, 480px)">
          {groups.map((group) => {
            const accessors = group.columns.map((c) => c.accessor);
            const shown = accessors.filter(isVisible).length;
            const allShown = shown === accessors.length;
            const isOpen = !!expanded[group.id];

            return (
              <div key={group.id}>
                <Group gap={0} wrap="nowrap" className={classes.groupRow}>
                  <Checkbox
                    label={group.label}
                    checked={allShown}
                    indeterminate={shown > 0 && !allShown}
                    onChange={() => setVisible(accessors, !allShown)}
                    className={classes.groupCheckbox}
                    classNames={{ label: classes.groupLabel }}
                  />
                  <Text size="xs" c="dimmed">
                    {`${shown}/${accessors.length}`}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    size={36}
                    aria-label={`Show individual ${group.label} columns`}
                    aria-expanded={isOpen}
                    className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`}
                    onClick={() => setExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                  >
                    <IconChevronDown size={14} />
                  </ActionIcon>
                </Group>

                <Collapse in={isOpen}>
                  {group.columns.map((col) => (
                    <div key={col.accessor} className={classes.columnRow}>
                      <Checkbox
                        size="xs"
                        pl={26}
                        label={col.label}
                        checked={isVisible(col.accessor)}
                        onChange={(e) => setVisible([col.accessor], e.currentTarget.checked)}
                        classNames={{ label: classes.columnLabel }}
                      />
                    </div>
                  ))}
                </Collapse>
              </div>
            );
          })}
        </ScrollArea.Autosize>

        <Group justify="space-between" className={classes.panelFooter}>
          <Button variant="subtle" color="gray" size="compact-sm" className={classes.quietAction} onClick={resetColumnsToggle}>
            Reset
          </Button>
          <Button
            variant="subtle"
            color="kfGreen"
            size="compact-sm"
            className={classes.primaryAction}
            onClick={() => setVisible(pickable, true)}
          >
            Show all
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}
