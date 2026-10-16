import CustomerDetailPage from "@/containers/customer";
import React, { Suspense } from "react";

const page = ({ params }: { params: Promise<{ id: string }> }) => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CustomerDetailPage params={params} />
      </Suspense>
    </div>
  );
};

export default page;
