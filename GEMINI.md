# Task Execution Workflow

When given a new task, you must follow this workflow strictly:

1. **Clarify Assumptions (Pre-planning):**
   - Before creating any subtasks, identify any open questions, ambiguities, or assumptions regarding the task.
   - Present these questions to the user and wait for their answers or verification. Do not proceed to planning until everything is clarified.

2. **Divide into Subtasks:**
   - Once all assumptions are cleared, divide the main task into a genuine amount of subtasks.
   - **Task Division Basis:** Divide tasks strictly by **Dependencies**. Ensure that foundational components are built first (e.g., Data models first, then services, then UI). Each subtask should logically depend on the completion of the previous ones.

3. **Propose the Plan:**
   - Propose the ordered list of subtasks to the user.
   - Explicitly ask for the user's verification and approval of the plan.
   - **CRITICAL:** If the user requests any changes to the proposed subtasks or plan during this stage, you MUST present the revised plan in its entirety and ask for explicit approval again. Do NOT jump into implementation until the revised plan is confirmed.

4. **Implementation and Approval:**
   - **Do not start implementation** until the user has explicitly verified and approved the subtasks.
   - Implement the subtasks one by one.

5. **Feedback Loop per Subtask:**
   - After completing a subtask, present the outcome to the user.
   - If the user proposes changes, address them immediately.
   - If the user disagrees with the implementation, propose a new implementation based on the user's preferences before moving to the next subtask.

6. **Dynamic Subtask Modification:**
   - The user may request changes to the plan or subtasks at any stage of the process. You must accommodate these changes and adjust the remaining plan accordingly.
