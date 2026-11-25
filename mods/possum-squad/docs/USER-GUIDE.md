# possum-squad — user guide

possum-squad keeps a pane beside the conversation listing the main session and the agents it
starts. It only watches: nothing Claude does changes because it is installed, and it adds
nothing to what Claude is sent. In the desktop app each one is a small pixel opossum beside a
few lines of text; in a terminal, the text alone.

## `/possums`

Type `/possums` to show the Possum Squad pane; type it again to hide it. If the pane is open but
out of sight, behind another pane's tab, `/possums` brings it forward instead of hiding it. It
works while Claude is in the middle of a turn, and prints nothing in the conversation. In a
terminal the pane docks beside the conversation in fullscreen at 110 columns or more, and
otherwise sits above the prompt.

**The pane opens by itself** when an agent starts, as the `autoOpen` setting says:
- `first` (the default): when the session's first agent starts, and again after a `/clear`;
- `always`: whenever a new agent starts and the pane is closed (an agent Claude resumes is not
  new);
- `never`: only when you ask, with `/possums`.

It never takes the keyboard from you, and never brings forward a pane that is open behind
another. In a terminal narrower than 144 columns, a pane that opens by itself waits, undrawn,
until you widen the terminal or type `/possums` (110 columns once you have opened it yourself).

**Closing the pane yourself,** with its close mark or key, keeps it closed: no agent opens it
again. Opening it yourself with `/possums`, `/possums open` or `/possums roles` takes that back,
and so does `/clear`, which starts the conversation and its list over. Hiding it with `/possums` is not such a close: with `always`,
the next agent opens it again.

`/possums open` does the same, except that it never hides the pane: use it when you want the
pane in view whatever its state.

`/possums roles` shows the gallery (below) in the pane, opening it or bringing it forward; it
never hides the pane.

## The pane

From the top:

1. **Main session:** the conversation itself, with a bar of how full its context is, the percent
   and its own tokens. The context reads "–" until Claude's first reply in the session, and
   again after a `/clear`, until the next reply.
2. **The session line:** tokens and time over the main session and every agent, such as
   `254k tokens · 4:12`, then the `collapse` button (*The collapsed view*, below).
3. **The sections,** each headed with its count, such as `Running · 2`:
   - **Needs you:** agents waiting on a permission prompt (*When an agent needs you*, below);
   - **Running:** agents starting, working or quiet. It is always there once an agent has
     started;
   - **Finished:** agents that finished, failed or were stopped. It starts folded, with a
     `show` button beside its heading; `hide` folds it again. Your choice is kept between
     sessions, and shared by every session you have open.

   A section other than Running shows only when it holds someone. Until an agent starts, the
   pane says "No agents yet. They show up here when Claude starts one." under the session line,
   with three opossums asleep above it in the desktop app.

**The time is work time:** the main session's turns added up, plus each agent's time, so with
several agents at once it runs faster than the clock on the wall. The main session's part grows
when each of Claude's turns ends, not during it. An agent that answers more than once (a
teammate, or one Claude resumes) counts from its first start, its rests included. Agents that
dropped out of the list (it keeps the latest 30 ended runs) still count.

**Times tick every second** while an agent runs and the pane is open, even when nothing else
happens. With nothing running, or the pane closed, nothing ticks. A pane open behind another
pane's tab keeps time without redrawing, so its next tick after you bring it back draws it
right. If the times ever stand still while an agent runs, `/possums open` starts them afresh.

In a terminal the pane is all text: block characters for the bars, and a coloured mark beside
each state word.

## The opossums

In the desktop app, and any app that draws pictures, every row starts with its opossum, and
the main session has its own, in the Lead's crown and robe. A row's opossum is plain until its
role is settled, then hops once and lands wearing that role's outfit for good. When its row
appears it slides in from the left, plain, and hops into its outfit if the role is already
known; for that first moment it stands, even if its agent has started work. Its pose says its
state:

- **starting:** standing;
- **working:** bobbing, its tool moving against it, blinking every few seconds;
- **quiet:** dozing on its feet, eyes closed, bobbing slowly;
- **needs you:** holding up a "?" sign, bobbing;
- **finished:** two hops in a cheer, then asleep as a "z" rises; still after 3 seconds;
- **stopped:** startled, with a "!", for a second, then standing;
- **failed:** on its back, tongue out, still.

The arrival, the hop, the cheer and the startle play once, when they happen: a row drawn again
later, such as Finished's when you press `show`, is drawn still. A finished or stopped row goes
to Finished, which is collapsed until you press `show`, so its cheer or startle shows only while
Finished is open. The state is always written
beside it too, so the picture never has to be read alone.

On the app's light theme each opossum's pale edges get a thin dark outline; on the dark theme
it has none. With `motion` at `off`, every opossum keeps still in its state's pose (a stopped one
startled); at `auto` they move, unless your system asks for reduced motion, which keeps them
still too, and a stopped one stands once its startle would be over.

**Sets.** The opossums all wear one set of costumes, chosen with `/possums set theme`:
`classic` (the default, a storybook mix: a hard hat for a Builder, a pith helmet for a Scout),
`steampunk`, `horror` or `prehistoric`. Changing it redraws every opossum at once. A role's name
never changes with the set: a Builder is a Builder, in a stitched creature's jacket in `horror`
or a stone hard hat in `prehistoric`.

**The gallery.** `/possums roles` replaces the list with every role of the current set, three
roles at a time. Each role shows its name and its costume's name, over its pose in each of the
eight states: the seven above, and **planned**, standing greyed and faded, which no agent uses
yet. The poses are moving: the arrival, the cheer and the startle play again every few seconds,
so you can watch any of them; with `motion` at `off` they are still.

Under the gallery's heading, `previous` and `next` move between its six parts, and `2 of 6` says
where you are. Going past the last part brings you back to the first. The gallery opens on its
first part, keeps its part while you change the set, and starts again from the first once
closed. In a terminal the gallery is text: each state's mark and word, then the part's roles and
their costumes. Its `close` button brings the list back, and so does closing the pane: the next
`/possums` opens on the list. While the gallery is open the pane is not redrawn every second, so
the session line's time moves only when an agent does something.

## What a row shows

Each subagent Claude starts gets a row the moment it starts, in the order they started:

1. its task in a few words, and its state: starting, working, needs you, quiet, finished,
   failed or stopped; "round 2" when a run with the same task already finished;
2. its role, such as Builder or Scout, once it is settled (*How roles are chosen*, below), or
   "Pick a role" until then, as a button (*Changing a role*); then the model it runs on and its
   effort, once its first request names them;
3. what it is doing: the last tool it asked for and what that names, such as "Reading
   notes.md", "Running npm test" or "Searching for TODO", cut to one line; "No tool calls yet"
   before its first; while it is quiet, how long, such as "Quiet for 2 min"; then the `peek`
   button (*Peek*, below);
4. how full its context is, as a bar and a percent, then its tokens and its time.

The tokens are what the agent read and wrote fresh; what it read back from the cache is left
out. The time ticks while it runs, and stops when it ends. A long line is cut
with an ellipsis, and a task longer than 100 characters is cut there. The state is always written out as a word, beside its colour.

**With many agents,** the pane keeps within what the desktop app can draw. From about twenty
working agents, the later rows' opossums stand still while the first ones keep moving; one
arriving or finishing never stops another, though its own slide or cheer may be skipped. With many more, the last rows show only
their state's coloured mark. Past sixty rows, the rest are not drawn: their section ends with a
line such as `and 12 more`, and its heading still counts every agent.

**Peek.** The `peek` button at the end of a row's third line opens, under the row:
- its task in full, wrapped over as many lines as it needs, up to 600 characters;
- **Brief:** what Claude asked the agent to do, its first 600 characters;
- **Last actions:** its last five tool calls, oldest first, read as the third line reads them;
- **Files changed:** the files it wrote or edited, each once, the latest ten; a long path shows
  its last 80 characters after `…`, so its name stays; files it only read show among its last
  actions;
- **Answer:** the start of its answer, 600 characters, once it has one. An agent that answers
  more than once shows its latest answer with text; while it works on a later turn, that answer
  is headed **Last answer**, since this turn has none yet.

A part with nothing in it yet is left out. The button reads `hide` while Peek is open; press it
to close Peek. Opening another row's Peek closes the first, and closing the pane closes it too.
Everything in Peek is plain text: markdown, a link or a tag in what an agent wrote shows as
written, never as formatting. Peek keeps nothing: what it shows lives with the session, and is
gone after a `/clear`.

## The collapsed view

The `collapse` button at the end of the session line folds the pane down to a glance: the main
session's opossum carrying a joey for each running agent, up to three, beside how many are
running, such as `4 running`, and `1 needs you` in the permission colour while any agent waits
on you. Running counts what the Running section holds (starting, working and quiet agents);
one that needs you is counted there instead. In a terminal it is one line of text. `expand`
brings the list back. Your choice is kept between sessions, and shared by every session you have
open. `/possums roles` still shows the gallery over a collapsed pane, and closing the gallery
brings the collapsed view back. While the gallery shows, the session line has no `collapse`
button.

**A minimized pane** in the desktop app always shows the collapsed view, whatever you chose,
with no button, since a click may not reach it there; the app's own control brings it back.

## When an agent needs you

**Needs you.** When an agent's tool call waits on a permission prompt, its row moves up to
Needs you and its opossum holds up a "?" sign; its third line still names the call it asks
about. You answer the app's own prompt, as always: the pane only points at it. Once the call has
run or been refused, and the agent's next reply is in, the row goes back to Running, so a call
you allowed that takes a while keeps the row in Needs you until it is done. A prompt for the
main session moves no row, since you see it already, and neither does a call another plugin or
hook answers for you, since nobody asks you.

**Quiet.** An agent that is starting or working, with no call running and nothing heard from it
for a minute and a half, shows as quiet: its opossum dozes on its feet, its state reads "quiet"
in amber, and its third line says for how long, such as "Quiet for 2 min". A call that is
running, however long, never makes it quiet, nor does the reply that follows one. The next thing
the agent does brings it back to working.

**Toasts.** While the list is out of sight (the pane closed, behind another pane's tab, waiting
to be drawn, collapsed, or showing the gallery), a small toast tells you instead:
- when an agent needs you: "Find where reports are built · needs you: waiting on a permission
  prompt";
- when an agent ends a turn that took more than a minute: "… · finished after 2:14", "… ·
  failed after 2:14" or "… · stopped after 1:05". For a teammate, or an agent Claude resumes,
  only that turn counts, not the time since it first started.

Each names the agent by its task, cut at 100 characters as on its row; one that asks before its
row has appeared is "An agent". There is one toast each time an agent comes to need you: a
second prompt while its row is still under Needs you adds none, and keeps the row there. With the pane in view there are none, since the
row says it.

## How roles are chosen

Each agent gets one of seventeen roles, which says what kind of work it is doing: Scout,
Planner, Builder, Tester, Bug catcher, Reviewer, Researcher, Operator, Courier, Writer, Artist,
Analyst, Guard, Janitor, Pilot or Helper; Lead is the main session's. The role comes from what
possum-squad sees anyway, never from asking a model, by the first of these that fits:

1. **The agent's type.** An Explore agent is a Scout, a Plan agent a Planner. An agent type of
   your own is read by its name, so a `code-reviewer` is a Reviewer. The general-purpose type
   says nothing.
2. **The words of its task.** Security words make a Guard. Then the first word, when it is a
   strong verb: "Review the migration plan" is a Reviewer's, "Document the test setup" a
   Writer's. "Design" is an Artist's, unless it designs a system, such as an API or a database
   schema, which is a Planner's. Then other words anywhere, from the specific to the general.
3. **Its first tool calls.** An edit or a write makes a Builder; a web search or fetch a
   Researcher; a browser or computer tool a Pilot; a shell command that runs tests a Tester, and
   one that commits, pushes, tags or opens a pull request a Courier. Six reads and searches with
   nothing else make a Scout. Any other shell command says nothing.
4. **Helper,** when nothing has settled it a minute after it started, or when it ends first. A
   teammate whose turn ends, or an agent whose turn left work running in the background, keeps
   its role open for its next turn, or the minute.

Until its role settles, a row shows none. Once settled, a run's role changes only when you
change it.

## Changing a role

A row's role name, or "Pick a role" while it has none, is a button (`[ Builder ]` in a
terminal). Press it and a list of the sixteen roles opens under the row, the current one
selected; Lead stays the main session's. Choose one and the row takes it at once: a working
opossum hops into the new outfit, and a finished one simply wears it. Choosing the role it
already has changes nothing on the row. `cancel`, a second press of the button, or closing the
pane closes the list without a change. Nothing the agent does
afterwards changes a role you chose.

**For an agent type of your own,** such as one a plugin or your settings define, the choice is
also remembered: every later agent of that type starts in the role you chose, before anything
else is read, in this session and the next. The type's name and the role are all that is
kept. For the built-in types and the general-purpose one, which most agents share, the choice
applies to that run alone, and the next agent's role is worked out as usual.

The opossum itself cannot be pressed: Claude Code draws it as a picture that takes no click.

## How a run ends

- **finished:** it answered with text;
- **stopped:** you interrupted it;
- **failed:** an error, a refusal, or an answer with no text.

A teammate (an agent of a team, which takes turns) that answers with a message and no text
rests as finished, and goes back to working on its next turn. An agent Claude resumes picks up
its own row again. The pane keeps the latest 30 ended runs.

The list belongs to the conversation: `/clear`, resuming another conversation or forking this
one empties it. The engine's own helpers (compacting, memory) never get a row.

If the pane cannot be shown or hidden (another plugin holds a pane of the same name), `/possums`
says so in one line.

## Settings

`/possums settings` lists every setting, its value, and the values it takes.
`/possums set <name> <value>` changes one and answers with its new value. If the name or the
value isn't one it knows, it answers with the names or the values it takes, and changes
nothing; `/possums set` alone names the settings. Names and values can be typed in any case.

| Setting | Values | Default | What it will do |
|---|---|---|---|
| `autoOpen` | `never`, `first`, `always` | `first` | Open the pane by itself never, when a session's first agent starts, or on every new agent. Works now. |
| `cost` | `off`, `estimate` | `off` | Show an estimated dollar figure beside the plan-limit percent. |
| `motion` | `auto`, `off` | `auto` | Animate the opossums, following your system's reduced-motion setting, or keep them still. Works now. |
| `theme` | `classic`, `steampunk`, `horror`, `prehistoric` | `classic` | The set of costumes the opossums wear, in the rows and the gallery. Works now. |

The settings are kept between sessions and shared by every session you have open. `autoOpen`,
`motion` and `theme` take effect at once; the others when the part of the pane they control arrives. If two
sessions change a setting at the same moment, one change may be lost: set it again.

Answers in words are marked as yours alone. Claude Code keeps such an answer out of what
Claude is sent for a command that waits its turn; whether it does for `/possums` typed between
turns has not been checked yet. Typed while Claude is working, Claude Code keeps the answer in
the conversation, as it does for any pane's command.

## Installing, updating, trying a build

- **Install once,** at user scope:
  `claude plugin install possum-squad --marketplace FairCat-GD/claude-code-mods`. In the desktop
  app it's + beside the prompt, then Plugins, then Add marketplace.
- **Update** with `claude plugin update possum-squad`, then start a new session. It installs a new
  version when one has been pushed; otherwise it changes nothing.
- **Try an unpushed build** with `claude --plugin-dir <repo>/mods/possum-squad`, run in a
  terminal. For that session it replaces the installed copy, and keeps its own stored values, so
  trying a build leaves the installed one's settings alone.
- **Turn it off** by disabling the plugin in Claude Code's plugin manager.
- **0.2.0's test setting,** "Test setting (does nothing)", is gone. A value you set for it stays
  in your Claude Code settings, unread; you can remove it there.
