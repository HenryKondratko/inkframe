import { render, screen } from '@testing-library/react'
import Editor from "./Editor.js";
import {expect, test} from "vitest";


test('renders the editor with welcome message', () => {
    render(<Editor />)
    expect(screen.getByText(/# welcome to inkframe/i)).toBeInTheDocument()
})
