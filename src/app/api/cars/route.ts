import { cars } from "@/data/cars";

export function GET() {
  return Response.json({ cars });
}
