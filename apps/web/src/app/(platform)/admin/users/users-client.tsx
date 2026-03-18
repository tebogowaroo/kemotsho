"use client"

import { useState, useEffect } from "react"
import { listUsersAction, createUserByAdminAction, unsubscribeUserAction, updateUserAction } from "@/app/actions/users"
import { Button } from "@kemotsho/core/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kemotsho/core/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kemotsho/core/ui/table"
import { Badge } from "@kemotsho/core/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@kemotsho/core/ui/dialog"
import { Input } from "@kemotsho/core/ui/input"
import { Label } from "@kemotsho/core/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kemotsho/core/ui/select"
import { Toggle } from "@kemotsho/core/ui/toggle"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const res = await listUsersAction()
    if (res.success) {
      setUsers(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <AddUserDialog onSuccess={loadData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName || "-"}</TableCell>
                    <TableCell>
                      {user.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className="mr-1">{r}</Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <EditUserDialog user={user} onSuccess={loadData} />
                            {user.status === "active" && (
                                <UnsubscribeButton userId={user.id} onSuccess={loadData} />
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState("cms:subscriber")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await createUserByAdminAction({
        email,
        displayName: displayName || null,
        roles: [role]
    })

    setLoading(false)

    if (res.success) {
        setOpen(false)
        onSuccess()
        setEmail("")
        setDisplayName("")
    } else {
        setError(typeof res.error === 'string' ? res.error : "Failed to create user")
        console.error(res.details)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} required type="email" />
            </div>
            <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[9999]">
                        <SelectItem value="cms:subscriber">Subscriber</SelectItem>
                        <SelectItem value="cms:author">Author</SelectItem>
                        <SelectItem value="cms:editor">Editor</SelectItem>
                        <SelectItem value="sys:admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Creating..." : "Create User"}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UnsubscribeButton({ userId, onSuccess }: { userId: string, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleUnsubscribe = async () => {
        if(!confirm("Are you sure you want to unsubscribe/suspend this user?")) return
        setLoading(true)
        const res = await unsubscribeUserAction(userId)
        setLoading(false)
        if(res.success) {
            onSuccess()
        } else {
            alert("Failed to unsubscribe")
        }
    }

    return (
        <Button size="sm" variant="destructive" disabled={loading} onClick={handleUnsubscribe}>
            Unsubscribe
        </Button>
    )
}

function EditUserDialog({ user, onSuccess }: { user: any, onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [displayName, setDisplayName] = useState(user.displayName || "")
    const [roles, setRoles] = useState<string[]>(user.roles || ["cms:subscriber"])
    const [status, setStatus] = useState(user.status || "active")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const availableRoles = ["cms:subscriber", "cms:author", "cms:editor", "sys:admin"]
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError("")
  
      const res = await updateUserAction({
          id: user.id,
          displayName: displayName || null,
          roles: roles,
          status: status
      })
  
      setLoading(false)
  
      if (res.success) {
          setOpen(false)
          onSuccess()
      } else {
          setError(typeof res.error === 'string' ? res.error : "Failed to update user")
          console.error(res.details)
      }
    }

    const toggleRole = (role: string) => {
        if (roles.includes(role)) {
            setRoles(roles.filter(r => r !== role))
        } else {
            setRoles([...roles, role])
        }
    }
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Edit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {user.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="flex flex-wrap gap-2">
                      {availableRoles.map(role => (
                          <Toggle 
                              key={role} 
                              variant="outline"
                              pressed={roles.includes(role)} 
                              onPressedChange={() => toggleRole(role)}
                              aria-label={`Toggle ${role}`}
                              type="button" // Prevent form submission
                          >
                              {role}
                          </Toggle>
                      ))}
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[9999]">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Saving..." : "Save Changes"}
              </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

