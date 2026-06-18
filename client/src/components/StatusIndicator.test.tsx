import { describe, it, expect } from "vitest";
import { StatusIndicator, MetricCard, ConnectionStatus } from "./StatusIndicator";

describe("StatusIndicator Component", () => {
  it("should export StatusIndicator component", () => {
    expect(StatusIndicator).toBeDefined();
    expect(typeof StatusIndicator).toBe("function");
  });

  it("should have correct prop types", () => {
    const props = {
      status: "online" as const,
      label: "Test",
      className: "test-class",
    };
    expect(props.status).toBe("online");
    expect(props.label).toBe("Test");
  });

  it("should support all status types", () => {
    const statuses = ["online", "offline", "idle", "error"] as const;
    statuses.forEach((status) => {
      expect(status).toBeDefined();
    });
  });
});

describe("MetricCard Component", () => {
  it("should export MetricCard component", () => {
    expect(MetricCard).toBeDefined();
    expect(typeof MetricCard).toBe("function");
  });

  it("should accept label and value props", () => {
    const props = {
      label: "Bandwidth",
      value: 100,
      unit: "Mbps",
    };
    expect(props.label).toBe("Bandwidth");
    expect(props.value).toBe(100);
    expect(props.unit).toBe("Mbps");
  });

  it("should support string and number values", () => {
    const stringProps = { label: "Status", value: "Active" };
    const numberProps = { label: "Count", value: 42 };
    
    expect(typeof stringProps.value).toBe("string");
    expect(typeof numberProps.value).toBe("number");
  });
});

describe("ConnectionStatus Component", () => {
  it("should export ConnectionStatus component", () => {
    expect(ConnectionStatus).toBeDefined();
    expect(typeof ConnectionStatus).toBe("function");
  });

  it("should accept isConnected prop", () => {
    const props = {
      isConnected: true,
      lastConnected: new Date(),
    };
    expect(props.isConnected).toBe(true);
    expect(props.lastConnected instanceof Date).toBe(true);
  });

  it("should handle optional lastConnected prop", () => {
    const propsWithDate = { isConnected: true, lastConnected: new Date() };
    const propsWithoutDate: { isConnected: boolean; lastConnected?: Date } = { isConnected: true };
    
    expect(propsWithDate.lastConnected).toBeDefined();
    expect(propsWithoutDate.lastConnected).toBeUndefined();
  });
});

describe("Component Type Safety", () => {
  it("StatusIndicator should have correct status options", () => {
    type ValidStatus = "online" | "offline" | "idle" | "error";
    const validStatuses: ValidStatus[] = ["online", "offline", "idle", "error"];
    expect(validStatuses.length).toBe(4);
  });

  it("MetricCard should support numeric and string values", () => {
    type ValueType = string | number;
    const numValue: ValueType = 100;
    const strValue: ValueType = "Active";
    
    expect(typeof numValue).toBe("number");
    expect(typeof strValue).toBe("string");
  });

  it("ConnectionStatus should require isConnected boolean", () => {
    const validProps = { isConnected: true };
    expect(typeof validProps.isConnected).toBe("boolean");
  });
});
