import { useQuery } from "@tanstack/react-query";

const Rvm = () => {
  const rvm = useQuery({
    queryKey: ["rvm"],
    queryFn: async () => {
      const response = await fetch("https://albarvm.teamnote.work/api/rvm/");

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/citybus-nwfb/route");
      }

      return response.json();
    },
  });

  console.log(rvm);

  return null;
};

export default Rvm;
