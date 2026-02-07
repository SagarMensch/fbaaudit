from typing import List, Dict, Any
import logging

class ReActAgent:
    """
    Layer 3: Reasoning & Acting
    Implements the ReAct pattern: Thought -> Action -> Observation -> Thought...
    """

    def __init__(self, lotus_engine, layout_engine, llm_client):
        self.lotus = lotus_engine
        self.layout = layout_engine
        self.llm = llm_client
        self.tools = {
            "calculator": self._tool_calculator,
            "filter": self._tool_filter,
            "lookup": self._tool_lookup
        }

    def solve(self, task: str, context: Dict[str, Any]) -> str:
        """
        Main loop for the ReAct agent.
        """
        history = []
        max_steps = 5
        
        print(f"ReAct Agent starting task: {task}")
        
        for i in range(max_steps):
            # 1. Generate Thought & Action
            prompt = self._construct_prompt(task, context, history)
            # response = self.llm.generate(prompt) # Mock
            
            # Simple simulation of reasoning logic for MVP
            if "total" in task.lower() and i == 0:
                response = 'Thought: I need to check if the line items sum up to the total amount.\nAction: calculator[sum(line_items)]'
            elif i == 1:
                response = 'Observation: The sum is 450. The total is 500.\nThought: There is a discrepancy. I should check for additional charges.\nAction: filter["description", "misc|handling|fuel"]'
            else:
                 response = 'Final Answer: Validated with discrepancy found: Missing $50 check.'
                 break

            history.append(response)
            print(f"Step {i+1}: {response}")
            
            # 2. Parse Action
            if "Final Answer:" in response:
                return response.split("Final Answer:")[1].strip()
            
            if "Action:" in response:
                action_part = response.split("Action:")[1].strip()
                # Parse action: tool[arg]
                tool_name = action_part.split("[")[0]
                arg = action_part.split("[")[1].rstrip("]")
                
                # 3. Execute Action
                observation = self._execute_tool(tool_name, arg, context)
                history.append(f"Observation: {observation}")

        return "Max steps reached."

    def _construct_prompt(self, task, context, history):
        return f"Task: {task}\nHistory: {history}\nNext Thought/Action:"

    def _execute_tool(self, tool_name, arg, context):
        if tool_name in self.tools:
            return self.tools[tool_name](arg, context)
        return f"Error: Tool {tool_name} not found."

    def _tool_calculator(self, expression, context):
        # Safe eval or specific logic
        return "450" # Mock result

    def _tool_filter(self, criteria, context):
        return "Found: 'Handling Fee: $50'"

    def _tool_lookup(self, query, context):
        return "Vendor: Acme Corp"
