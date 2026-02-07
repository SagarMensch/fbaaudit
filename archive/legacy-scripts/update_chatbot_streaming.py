import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\components\AetherChatbot.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the handleSend function with streaming version
old_handle_send = r"const handleSend = async \(\) => \{[^}]+\};\s+\};\s+\}, 3000\); // Increased from 500ms to 3000ms for Ollama\s+\};"

new_handle_send = """const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        // Create placeholder for AI response
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
            id: aiMessageId,
            text: "Vector is thinking...",
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        try {
            // Call Ollama with streaming
            let streamedText = '';
            const response = await generateOllamaResponse(
                newUserMessage.text,
                (chunk) => {
                    // Update message as chunks arrive
                    streamedText += chunk;
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? { ...msg, text: streamedText }
                            : msg
                    ));
                }
            );

            // If streaming didn't work, use full response
            if (response && streamedText === '') {
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                        ? { ...msg, text: response }
                        : msg
                ));
            }

            // If Ollama failed, try local intelligence
            if (!response) {
                const localResponse = processLocalIntent(newUserMessage.text);
                if (localResponse) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? localResponse
                            : msg
                    ));
                } else {
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? { ...msg, text: "Ollama is not responding. Make sure 'ollama serve' is running.\\n\\nTry: 'Show me spend graph' for instant results." }
                            : msg
                    ));
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                    ? { ...msg, text: "Error connecting to Ollama. Please check if it's running." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };"""

content = re.sub(old_handle_send, new_handle_send, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\components\AetherChatbot.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated chatbot with streaming support!")
