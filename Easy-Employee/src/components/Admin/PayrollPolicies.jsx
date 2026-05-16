import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import HeaderSection from "../HeaderSection";
import {
  addPayrollPolicy,
  deletePayrollPolicy,
  getPayrollPolicies,
  updatePayrollPolicy,
} from "../../http";

const emptyPolicy = {
  title: "",
  category: "General",
  description: "",
  status: "active",
  rules: [{ label: "", value: "", note: "" }],
};

const PayrollPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(emptyPolicy);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await getPayrollPolicies();
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setPolicies(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payroll policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(policies.map((item) => item.category).filter(Boolean))),
    [policies]
  );

  const visiblePolicies = useMemo(() => {
    const term = search.trim().toLowerCase();
    return policies.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.description} ${(item.rules || [])
        .map((rule) => `${rule.label} ${rule.value} ${rule.note || ""}`)
        .join(" ")}`.toLowerCase();
      return (!category || item.category === category) && (!term || haystack.includes(term));
    });
  }, [policies, search, category]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateRule = (index, key, value) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [key]: value } : rule
      ),
    }));
  };

  const addRule = () => {
    setForm((current) => ({
      ...current,
      rules: [...current.rules, { label: "", value: "", note: "" }],
    }));
  };

  const removeRule = (index) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const startEdit = (policy) => {
    setEditingId(policy._id);
    setForm({
      title: policy.title || "",
      category: policy.category || "General",
      description: policy.description || "",
      status: policy.status || "active",
      rules: policy.rules?.length
        ? policy.rules.map((rule) => ({
            label: rule.label || "",
            value: rule.value || "",
            note: rule.note || "",
          }))
        : [{ label: "", value: "", note: "" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyPolicy);
  };

  const savePolicy = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim() || "General",
      rules: form.rules
        .map((rule) => ({
          label: rule.label.trim(),
          value: rule.value.trim(),
          note: (rule.note || "").trim(),
        }))
        .filter((rule) => rule.label && rule.value),
    };

    if (!payload.title) return toast.error("Policy title is required");
    if (!payload.rules.length) return toast.error("At least one rule is required");

    setSaving(true);
    try {
      if (editingId) {
        await updatePayrollPolicy(editingId, payload);
        toast.success("Policy updated successfully");
      } else {
        await addPayrollPolicy(payload);
        toast.success("Policy created successfully");
      }
      resetForm();
      loadPolicies();
    } catch (err) {
      console.error(err);
      toast.error("Policy could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const removePolicy = async (policy) => {
    if (!window.confirm(`Delete ${policy.title}?`)) return;
    try {
      await deletePayrollPolicy(policy._id);
      toast.success("Policy deleted successfully");
      loadPolicies();
    } catch (err) {
      console.error(err);
      toast.error("Policy could not be deleted");
    }
  };

  return (
    <div className="main-content">
      <section className="section">
        <HeaderSection title="Company Payroll Policies" />

        <div className="card">
          <div className="card-header">
            <h4>{editingId ? "Edit Policy" : "Add Policy"}</h4>
          </div>
          <div className="card-body">
            <Form onSubmit={savePolicy}>
              <div className="row">
                <Form.Group className="col-md-4">
                  <Form.Label>Policy Title</Form.Label>
                  <Form.Control value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control value={form.category} onChange={(e) => updateForm("category", e.target.value)} />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Control as="select" value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group className="col-md-2 d-flex align-items-end">
                  <Button className="w-100" variant="outline-primary" type="button" onClick={addRule}>
                    Add Rule
                  </Button>
                </Form.Group>
              </div>

              <Form.Group className="mt-3">
                <Form.Label>Description</Form.Label>
                <Form.Control value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
              </Form.Group>

              <h6 className="mt-4">Rules</h6>
              {form.rules.map((rule, index) => (
                <div className="row align-items-end mb-2" key={index}>
                  <Form.Group className="col-md-3">
                    <Form.Label>Rule Name</Form.Label>
                    <Form.Control value={rule.label} onChange={(e) => updateRule(index, "label", e.target.value)} />
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label>Rule Value</Form.Label>
                    <Form.Control value={rule.value} onChange={(e) => updateRule(index, "value", e.target.value)} />
                  </Form.Group>
                  <Form.Group className="col-md-3">
                    <Form.Label>Note</Form.Label>
                    <Form.Control value={rule.note || ""} onChange={(e) => updateRule(index, "note", e.target.value)} />
                  </Form.Group>
                  <div className="col-md-2">
                    <Button
                      className="w-100"
                      disabled={form.rules.length === 1}
                      type="button"
                      variant="outline-danger"
                      onClick={() => removeRule(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="text-center mt-4">
                <Button disabled={saving} type="submit" variant="success" style={{ width: "200px" }}>
                  {saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
                </Button>
                {editingId ? (
                  <Button className="ml-2" type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </Form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>Default Corporate Values</h4>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Search policy, category, or rule"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" />
              </div>
            ) : (
              visiblePolicies.map((policy) => (
                <div className="border rounded p-3 mb-3" key={policy._id}>
                  <div className="d-flex justify-content-between flex-wrap">
                    <div>
                      <h5 className="mb-1">{policy.title}</h5>
                      <span className="badge badge-primary mr-2">{policy.category}</span>
                      <span className="badge badge-light">{policy.status}</span>
                      {policy.isDefault ? <span className="badge badge-info ml-2">Default</span> : null}
                    </div>
                    <div>
                      <Button size="sm" variant="outline-primary" onClick={() => startEdit(policy)}>
                        Edit
                      </Button>
                      <Button size="sm" className="ml-2" variant="outline-danger" onClick={() => removePolicy(policy)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  {policy.description ? <p className="text-muted mt-2 mb-0">{policy.description}</p> : null}
                  <div className="table-responsive mt-3">
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        {(policy.rules || []).map((rule, index) => (
                          <tr key={`${rule.label}-${index}`}>
                            <th style={{ width: "35%" }}>{rule.label}</th>
                            <td>{rule.value}</td>
                            {rule.note ? <td>{rule.note}</td> : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
            {!loading && !visiblePolicies.length ? (
              <div className="text-center text-muted">No payroll policies found</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PayrollPolicies;
