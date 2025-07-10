import { check } from "../lib/process";
import React from "react";
import ContainerDashboard from "@/components/ContainerDashboard";
import { getEvents, getStacks } from "@/lib/db";
import StackList from "@/components/StackTable";
import EventTable from "@/components/EventTable";

export default async function Home() {
  // const [containers, setContainers] = React.useState<any>([]);
  // const [stacks, setStacks] = React.useState<any>([]);
  // const [events, setEvents] = React.useState<any>([]);
  // const [totalEvents, setTotalEvents] = React.useState(0);
  // const [page, setPage] = React.useState(1);
  const pageSize = 10;
  let containers = [];
  const response: any = await check();
  containers = response.containers;
  console.log(containers);
  const stacks = await getStacks();
  const events = (await getEvents()).events;
  const totalEvents = 10;
  const page = 1;

  // async function handleCheck() {
  //   let response: any = await check();
  //   setContainers(response.containers);
  //   console.log(response);
  //   response = await getStacks();
  //   setStacks(response);
  //   console.log(response);
  //   response = await getEvents();
  //   setEvents(response.events);
  //   console.log(response);
  // }

  // async function fetchEvents(page: number) {
  //   const { events, total } = await getEvents(page, pageSize);
  //   setEvents(events);
  //   setTotalEvents(total);
  // }

  // React.useEffect(() => {
  //   fetchEvents(page);
  // }, [page]);

  // React.useEffect(() => {
  //   handleCheck();
  // }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold p-2">SID Dashboard</h1>
      </div>
      <br />
      {containers && containers.length > 0 ? (
        <ContainerDashboard containers={containers} />
      ) : (
        <div className="p-8 text-center text-gray-500">
          Loading containers...
        </div>
      )}
      <br />
      <StackList stacks={stacks} />
      <br />
      <EventTable
        events={events}
        page={page}
        total={totalEvents}
        pageSize={pageSize}
        //    onPageChange={setPage}
      />
    </div>
  );
}
