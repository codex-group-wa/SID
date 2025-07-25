import { check } from "../lib/process";
import ContainerDashboard from "@/components/ContainerDashboard";
import { getEvents, getStacks } from "@/lib/db";
import StackList from "@/components/StackTable";
import EventTable from "@/components/EventTable";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Container } from "lucide-react";

export const revalidate = 60;

export default async function Home(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const { searchParams } = props;
  const pageSize = 10;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = Number(resolvedSearchParams.page) || 1;
  let containers = [];
  const response: any = await check();
  containers = response.containers;
  const stacks = await getStacks();
  const { events, total } = await getEvents(currentPage, pageSize);

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold p-2 flex gap-2">
          <Container className="mt-1" />
          SID Dashboard
        </h1>
        <div className="flex gap-2 items-center">
          <AutoRefresh />
          {process.env.NEXT_PUBLIC_APP_VERSION ? (
            <a
              href="https://github.com/declan-wade/SID/releases"
              className="text-gray-500 hidden sm:block"
              target="_blank"
            >
              SID {process.env.NEXT_PUBLIC_APP_VERSION!}
            </a>
          ) : (
            <a
              href="https://github.com/declan-wade/SID/releases"
              className="text-gray-500 hidden sm:block"
              target="_blank"
            >
              GitHub
            </a>
          )}
        </div>
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
        page={currentPage}
        total={total}
        pageSize={pageSize}
      />
    </div>
  );
}
