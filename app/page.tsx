import { check } from "../lib/process";
import React from "react";
import ContainerDashboard from "@/components/ContainerDashboard";
import { getEvents, getStacks } from "@/lib/db";
import StackList from "@/components/StackTable";
import EventTable from "@/components/EventTable";

export default async function Home() {
  const containerData = await check() || { containers: [] };
  const stacksData = await getStacks() || [];
  const eventPageSize = 10;
  const initialEventsData = await getEvents(1, eventPageSize) || { events: [], total: 0 };

  // Removed useState for page and totalEvents
  // Removed fetchEvents function
  // Removed useEffect hook for page changes

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold p-2">SID Dashboard</h1>
      </div>
      <br />
      {containerData.containers && containerData.containers.length > 0 ? (
        <ContainerDashboard containers={containerData.containers} />
      ) : (
        <div className="p-8 text-center text-gray-500">
          No containers found or failed to load.
        </div>
      )}
      <br />
      <StackList stacks={stacksData} />
      <br />
      <EventTable
        initialEvents={initialEventsData.events}
        totalEvents={initialEventsData.total}
        pageSize={eventPageSize}
      />
    </div>
  );
}
