import connectDB from "@/lib/mongodb";

export async function GET() {
    try {
        const mongoose = await connectDB();

        if (!mongoose) {
            return Response.json(
                {
                    connected: false,
                    message: "MongoDB connection failed",
                },
                { status: 500 }
            );
        }

        if (mongoose.connection.readyState !== 1) {
            return Response.json(
                {
                    connected: false,
                    readyState: mongoose.connection.readyState,
                    message: "MongoDB is not connected",
                },
                { status: 500 }
            );
        }

        if (!mongoose.connection.db) {
            return Response.json(
                {
                    connected: false,
                    message: "MongoDB database is not available",
                },
                { status: 500 }
            );
        }

        await mongoose.connection.db.command({
            ping: 1,
        });

        return Response.json({
            connected: true,
            message: "MongoDB connection works!",
            database: mongoose.connection.name,
        });
    } catch (error) {
        console.error("[test-db] MongoDB error:", error);

        return Response.json(
            {
                connected: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown MongoDB error",
            },
            { status: 500 }
        );
    }
}
