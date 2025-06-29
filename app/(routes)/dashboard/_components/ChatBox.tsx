function ChatBox() {
    return (
        <div className="p-[1px] relative rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 w-1/4 h-[650px]">
            <div className="bg-white rounded-lg p-4 h-full w-full">
                <div className="space-y-4">
                    {/* Chat content will go here */}
                    <p className="text-gray-700">ChatBox content</p>
                </div>
            </div>
        </div>
    );
}

export default ChatBox;