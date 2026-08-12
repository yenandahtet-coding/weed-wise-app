import sys

def resolve_theirs(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    out = []
    in_ours = False
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_ours = True
            continue
        if line.startswith('======='):
            in_ours = False
            continue
        if line.startswith('>>>>>>>'):
            continue
            
        if not in_ours:
            out.append(line)
            
    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(out)
        
resolve_theirs('src/routeTree.gen.ts')
resolve_theirs('src/routes/simulation.tsx')
print("Resolved conflicts!")
