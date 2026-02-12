"use server";

import prisma from "@/lib/prisma";

export async function getContests() {
    const contests = prisma.contest.findMany({
        where: {
            isOfficial: true
        }
    });
    return contests
}