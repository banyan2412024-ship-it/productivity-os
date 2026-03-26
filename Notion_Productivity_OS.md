# Notion Productivity OS Template

This document is a complete build guide for a Notion-based productivity system with an Idea Base, Projects, Tasks, Priority Engine, Calendar views, and a Dashboard.

## 1. Databases (Create in this order)

1. Idea Base
2. Projects
3. Tasks
4. Calendar (as a view of Tasks, not a separate database)

## 2. Idea Base

**Database name:** Idea Base  
**Purpose:** Capture every idea quickly, then categorize later.

**Properties**

- `Name` (Title) – Idea title
- `Category` (Multi-select) – Idea type
- `Domain` (Multi-select) – Area of life
- `Impact` (Select) – Potential value
- `Effort` (Select) – Effort estimate
- `Status` (Select) – Idea stage
- `Created` (Created time) – When idea appeared
- `Project` (Relation → Projects)
- `Score` (Formula) – Idea importance score
- `Notes` (Text) – Extra thinking

**Category options**

- Business
- Tech
- Automation
- AI
- Reselling
- Content
- Investment
- Life Optimization
- Learning
- Other

**Domain options**

- Money
- Systems
- Health
- Knowledge
- Network
- Lifestyle

**Status options**

- Inbox
- Exploring
- Validated
- Project
- Archived

**Impact options**

- Low
- Medium
- High
- Massive

**Effort options**

- Tiny
- Small
- Medium
- Large
- Huge

**Idea Score formula**

Create a Formula property called `Score` with:

```notion
let(
  impact,
  if(prop("Impact") == "Massive", 4,
  if(prop("Impact") == "High", 3,
  if(prop("Impact") == "Medium", 2,
  if(prop("Impact") == "Low", 1, 0)))),
  effort,
  if(prop("Effort") == "Tiny", 4,
  if(prop("Effort") == "Small", 3,
  if(prop("Effort") == "Medium", 2,
  if(prop("Effort") == "Large", 1,
  if(prop("Effort") == "Huge", 0, 0)))),
  impact + effort
)
```

## 3. Projects

**Database name:** Projects  
**Purpose:** Track execution of ideas.

**Properties**

- `Name` (Title) – Project name
- `Idea` (Relation → Idea Base)
- `Status` (Select) – Project stage
- `Priority` (Select) – Project importance
- `Progress` (Number) – % progress
- `Tasks` (Relation → Tasks)
- `Next Task` (Rollup) – Highest priority task
- `Deadline` (Date) – Optional
- `Created` (Created time)

**Project Status options**

- Planning
- Active
- Paused
- Completed
- Killed

**Priority options**

- Low
- Medium
- High
- Critical

**Next Task rollup**

Rollup settings:

- Relation: `Tasks`
- Property: `Score`
- Calculate: `Max`

This lets you surface the highest scoring task for each project.

## 4. Tasks

**Database name:** Tasks  
**Purpose:** Actionable work.

**Properties**

- `Task` (Title) – Task name
- `Project` (Relation → Projects)
- `Status` (Select) – Task status
- `Priority` (Select) – Task importance
- `Effort` (Select) – Time estimate
- `Deadline` (Date) – Optional
- `Scheduled` (Date) – Work date
- `Score` (Formula) – Task relevance
- `Created` (Created time)

**Status options**

- Backlog
- Ready
- Doing
- Blocked
- Done

**Priority options**

- Low
- Medium
- High
- Critical

**Effort options**

- 5m
- 30m
- 1h
- 2h
- Half Day
- Full Day

**Task Score formula**

This combines task priority with deadline urgency. Create a Formula property called `Score`:

```notion
let(
  priority,
  if(prop("Priority") == "Critical", 4,
  if(prop("Priority") == "High", 3,
  if(prop("Priority") == "Medium", 2,
  if(prop("Priority") == "Low", 1, 0)))),
  deadline,
  if(empty(prop("Deadline")), 1,
  if(dateBetween(prop("Deadline"), now(), "days") <= 0, 4,
  if(dateBetween(prop("Deadline"), now(), "days") <= 3, 3,
  if(dateBetween(prop("Deadline"), now(), "days") <= 7, 2, 1)))),
  priority + deadline
)
```

Notes:

- Due today or overdue: 4
- Due within 3 days: 3
- Due within 7 days: 2
- Later: 1

## 5. Calendar (Tasks Views)

Create a Calendar view on the Tasks database and choose:

- Date property: `Scheduled` (primary)
- Show `Deadline` as a secondary date in the card if you want a visual warning

Views to create in Tasks:

- `Calendar` (Calendar view)
- `Today` (Filter: Scheduled is Today OR Deadline is Today)
- `This Week` (Filter: Scheduled within this week OR Deadline within this week)
- `Upcoming` (Filter: Deadline is after today)
- `Work Now` (see section 7)
- `Backlog` (Filter: Status = Backlog)
- `Done` (Filter: Status = Done)

## 6. Task Relevance Engine

The `Score` formula above is the relevance engine. Sort tasks by:

- `Score` descending
- `Deadline` ascending

## 7. “Work Now” View (Tasks)

Create a filtered view:

Filters:

- Status is not Done
- Status is not Blocked

Sort:

- Score descending
- Deadline ascending

This becomes your “Work Now” view for the dashboard.

## 8. Required Views

**Idea Base**

- `Inbox` (Status = Inbox)
- `Top Ideas` (Sort Score desc)
- `By Category` (Grouped by Category)
- `Exploring` (Status = Exploring)
- `Projects` (Status = Project)

**Projects**

- `Active` (Status = Active)
- `Planning` (Status = Planning)
- `Completed` (Status = Completed)

**Tasks**

- `Work Now`
- `Today`
- `This Week`
- `Backlog`
- `Done`

## 9. Dashboard Page

Create a page called `Productivity OS` with these sections:

**Capture**

- Add a “New” button linked to the Idea Base

**Work Now**

- Linked database view of Tasks
- Use `Work Now` view

**Active Projects**

- Linked database view of Projects
- Filter: Status = Active

**Idea Pipeline**

- Linked database view of Idea Base
- Filter: Status = Exploring
- Sort: Score descending

**Calendar**

- Linked database view of Tasks
- Use `Calendar` view

## 10. Idea → Project Workflow

1. Change Idea `Status` → Project
2. Create a new Project and link it to the Idea
3. Break the Project into Tasks and link them

## 11. Optional Enhancements

**Idea Incubator**

- Create a view in Idea Base with a filter: Created is within past 7 days
- Review weekly and move to Exploring or Archived

**Weekly Review Page**

- Top Ideas (Score desc, Status = Exploring)
- Active Projects
- Upcoming Deadlines (Tasks with Deadline within next 7 days)

**AI Idea Summary**

- Use Notion AI on Idea cards to generate summaries when needed

---

If you want, I can create a second version of this file with screenshots placeholders and a step-by-step click path for each database and view.
