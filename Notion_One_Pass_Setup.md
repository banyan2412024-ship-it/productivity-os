# Notion Productivity OS — One-Pass Setup (Minimal Input)

This guide is designed to get you fully set up in one short session with the least possible manual work. Import the CSVs, then paste formulas, then add views.

## 0. Files Ready for Import

- `Idea_Base.csv`
- `Projects.csv`
- `Tasks.csv`

## 1. Import the Databases

In Notion, run these three imports:

1. Import `Idea_Base.csv` and name the database **Idea Base**
2. Import `Projects.csv` and name the database **Projects**
3. Import `Tasks.csv` and name the database **Tasks**

## 2. Set Property Types (Fast Pass)

Notion will import all columns as text. Convert these to correct types:

**Idea Base**
- `Name` → Title
- `Category` → Multi-select
- `Domain` → Multi-select
- `Impact` → Select
- `Effort` → Select
- `Status` → Select
- `Notes` → Text
- Add: `Created` (Created time)
- Add: `Project` (Relation → Projects)
- Add: `Score` (Formula)

**Projects**
- `Name` → Title
- `Idea` → Relation → Idea Base
- `Status` → Select
- `Priority` → Select
- `Progress` → Number (percent)
- `Deadline` → Date
- Add: `Tasks` (Relation → Tasks)
- Add: `Next Task` (Rollup)
- Add: `Created` (Created time)

**Tasks**
- `Task` → Title
- `Project` → Relation → Projects
- `Status` → Select
- `Priority` → Select
- `Effort` → Select
- `Deadline` → Date
- `Scheduled` → Date
- Add: `Score` (Formula)
- Add: `Created` (Created time)

## 3. Add Select Options

**Idea Base**
- Category: Business, Tech, Automation, AI, Reselling, Content, Investment, Life Optimization, Learning, Other
- Domain: Money, Systems, Health, Knowledge, Network, Lifestyle
- Status: Inbox, Exploring, Validated, Project, Archived
- Impact: Low, Medium, High, Massive
- Effort: Tiny, Small, Medium, Large, Huge

**Projects**
- Status: Planning, Active, Paused, Completed, Killed
- Priority: Low, Medium, High, Critical

**Tasks**
- Status: Backlog, Ready, Doing, Blocked, Done
- Priority: Low, Medium, High, Critical
- Effort: 5m, 30m, 1h, 2h, Half Day, Full Day

## 4. Formulas (Copy/Paste)

**Idea Base → Score**

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

**Tasks → Score**

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

**Projects → Next Task Rollup**

Rollup settings:
- Relation: `Tasks`
- Property: `Score`
- Calculate: `Max`

## 5. Required Views

**Idea Base**
- Inbox (Status = Inbox)
- Top Ideas (Sort: Score desc)
- By Category (Group by Category)
- Exploring (Status = Exploring)
- Projects (Status = Project)

**Projects**
- Active (Status = Active)
- Planning (Status = Planning)
- Completed (Status = Completed)

**Tasks**
- Work Now (Status != Done, Status != Blocked; Sort Score desc, Deadline asc)
- Today (Scheduled is Today OR Deadline is Today)
- This Week (Scheduled within this week OR Deadline within this week)
- Backlog (Status = Backlog)
- Done (Status = Done)
- Calendar (Calendar view by Scheduled)
- Upcoming (Deadline after today)

## 6. Dashboard Page (Productivity OS)

Create a page called **Productivity OS** and add:

- Capture: New button → Idea Base
- Work Now: Linked Tasks view (Work Now)
- Active Projects: Linked Projects view (Active)
- Idea Pipeline: Linked Idea Base view (Exploring + sort by Score)
- Calendar: Linked Tasks view (Calendar)

## 7. Workflow

When an idea becomes real:
1. Set Idea Status → Project
2. Create Project and link Idea
3. Create Tasks and link Project

That’s it. Your system is fully operational.
