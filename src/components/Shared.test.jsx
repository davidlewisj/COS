import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Av, CircleCk, Modal, DonutChart } from "./Shared";

describe("Av", () => {
  it("renders the first two initials of the member's name", () => {
    render(<Av m={{ name: "Jane Doe" }} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders the avatar photo instead of initials when present", () => {
    render(<Av m={{ name: "Jane Doe", avatar: "data:image/png;base64,abc123" }} />);
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
    const img = screen.getByAltText("Jane Doe");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc123");
  });
});

describe("CircleCk", () => {
  it("calls toggle when clicked", () => {
    const toggle = vi.fn();
    const { container } = render(<CircleCk on={false} toggle={toggle} />);
    fireEvent.click(container.querySelector(".circle-ck"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("renders a checkmark only when on", () => {
    const { container, rerender } = render(<CircleCk on={false} toggle={() => {}} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    rerender(<CircleCk on={true} toggle={() => {}} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders the title and children", () => {
    render(<Modal title="Edit Rock" onClose={() => {}}><p>Body content</p></Modal>);
    expect(screen.getByText("Edit Rock")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal title="t" onClose={onClose}>x</Modal>);
    fireEvent.click(container.querySelector(".overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal body is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal title="t" onClose={onClose}>x</Modal>);
    fireEvent.click(container.querySelector(".modal"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("DonutChart", () => {
  it("renders the hits/total label", () => {
    render(<DonutChart hits={3} total={8} />);
    expect(screen.getByText("3/8")).toBeInTheDocument();
  });
});
